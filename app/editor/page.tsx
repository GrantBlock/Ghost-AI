import { Suspense } from "react";

import { EditorHome } from "@/components/editor/editor-home";
import { getUserProjects } from "@/lib/project-data";

async function EditorHomeLoader() {
  const { owned, shared } = await getUserProjects();
  return <EditorHome ownedProjects={owned} sharedProjects={shared} />;
}

export default function EditorPage() {
  return (
    <Suspense>
      <EditorHomeLoader />
    </Suspense>
  );
}
