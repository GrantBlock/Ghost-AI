"use client";

import { Plus } from "lucide-react";

import { EditorShell } from "@/components/editor/editor-shell";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/projects";

interface EditorHomeProps {
  ownedProjects: Project[];
  sharedProjects: Project[];
}

export function EditorHome({ ownedProjects, sharedProjects }: EditorHomeProps) {
  return (
    <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
      {({ openCreate }) => (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-semibold text-copy-primary">
            Create a project or open an existing one
          </h1>
          <p className="max-w-md text-sm text-copy-muted">
            Start a new architecture workspace, or choose a project from the
            sidebar.
          </p>
          <Button className="rounded-xl" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      )}
    </EditorShell>
  );
}
