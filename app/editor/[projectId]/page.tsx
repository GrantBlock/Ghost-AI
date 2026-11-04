import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EditorShell } from "@/components/editor/editor-shell";
import { getUserProjects } from "@/lib/project-data";

async function WorkspaceLoader({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { owned, shared } = await getUserProjects();
  const project = [...owned, ...shared].find((p) => p.id === projectId);
  if (!project) notFound();

  // Placeholder workspace: the canvas is built in a later feature.
  return (
    <EditorShell ownedProjects={owned} sharedProjects={shared}>
      <>
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
          <h1 className="text-xl font-semibold text-copy-primary">
            {project.name}
          </h1>
          <p className="text-xs text-copy-muted">Room: {project.id}</p>
        </div>
      </>
    </EditorShell>
  );
}

export default function WorkspacePage(props: PageProps<"/editor/[projectId]">) {
  return (
    <Suspense>
      <WorkspaceLoader params={props.params} />
    </Suspense>
  );
}
