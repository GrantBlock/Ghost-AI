import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AccessDenied } from "@/components/editor/access-denied";
import { EditorShell } from "@/components/editor/editor-shell";
import { getProjectIfAccessible, getCurrentIdentity } from "@/lib/project-access";
import { getUserProjects } from "@/lib/project-data";

async function WorkspaceLoader({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  const identity = await getCurrentIdentity();
  if (!identity) redirect("/sign-in");

  const project = await getProjectIfAccessible(roomId, identity);
  if (!project) return <AccessDenied />;

  const { owned, shared } = await getUserProjects();

  return (
    <EditorShell
      ownedProjects={owned}
      sharedProjects={shared}
      projectName={project.name}
      projectId={project.id}
      isOwner={project.isOwner}
    >
      {/* Canvas placeholder: real canvas logic arrives in a later feature. */}
      <div className="flex h-full items-center justify-center bg-base px-6 text-center">
        <p className="text-sm text-copy-muted">
          Canvas for {project.name} will appear here.
        </p>
      </div>
    </EditorShell>
  );
}

export default function WorkspacePage(props: PageProps<"/editor/[roomId]">) {
  return (
    <Suspense>
      <WorkspaceLoader params={props.params} />
    </Suspense>
  );
}
