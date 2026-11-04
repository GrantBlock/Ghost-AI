"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { Button } from "@/components/ui/button";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const projectDialogs = useProjectDialogs();

  return (
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
      <div className="relative flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ownedProjects={projectDialogs.ownedProjects}
          sharedProjects={projectDialogs.sharedProjects}
          onCreate={projectDialogs.openCreate}
          onRename={projectDialogs.openRename}
          onDelete={projectDialogs.openDelete}
        />
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-semibold text-copy-primary">
            Create a project or open an existing one
          </h1>
          <p className="max-w-md text-sm text-copy-muted">
            Start a new architecture workspace, or choose a project from the
            sidebar.
          </p>
          <Button className="rounded-xl" onClick={projectDialogs.openCreate}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>
      <ProjectDialogs state={projectDialogs} />
    </div>
  );
}
