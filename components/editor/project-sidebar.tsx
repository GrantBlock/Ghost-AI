"use client";

import { FolderOpen, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  ownedProjects: Project[];
  sharedProjects: Project[];
  onCreate: () => void;
  onRename: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span className="text-copy-faint">{icon}</span>
      <p className="text-sm font-medium text-copy-secondary">{title}</p>
      <p className="text-xs text-copy-muted">{description}</p>
    </div>
  );
}

interface ProjectItemProps {
  project: Project;
  onRename: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

function ProjectItem({ project, onRename, onDelete }: ProjectItemProps) {
  return (
    <li className="group flex items-center gap-1 rounded-xl px-3 py-2 hover:bg-elevated">
      <span className="min-w-0 flex-1 truncate text-sm text-copy-secondary group-hover:text-copy-primary">
        {project.name}
      </span>
      {project.isOwner ? (
        <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onRename(project.id)}
            aria-label={`Rename ${project.name}`}
            className="text-copy-muted hover:text-copy-primary"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(project.id)}
            aria-label={`Delete ${project.name}`}
            className="text-copy-muted hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      ) : null}
    </li>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onCreate,
  onRename,
  onDelete,
}: ProjectSidebarProps) {
  return (
    <>
      {/* Mobile backdrop scrim: tapping outside the sidebar closes it. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "absolute inset-0 z-10 bg-base/70 transition-opacity duration-200 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "absolute top-0 bottom-0 left-0 z-20 flex w-80 max-w-[85vw] flex-col border-r border-surface-border bg-surface/90 backdrop-blur-md transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border px-4">
          <h2 className="text-sm font-semibold text-copy-primary">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
            className="text-copy-muted hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="min-h-0 flex-1 gap-0 p-3">
          <TabsList className="w-full">
            <TabsTrigger value="my-projects">My projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
          <TabsContent value="my-projects" className="min-h-0 overflow-y-auto">
            {ownedProjects.length === 0 ? (
              <EmptyState
                icon={<FolderOpen className="h-8 w-8" />}
                title="No projects yet"
                description="Create your first project to get started."
              />
            ) : (
              <ul className="mt-2 flex flex-col gap-0.5">
                {ownedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    onRename={onRename}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="shared" className="min-h-0 overflow-y-auto">
            {sharedProjects.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="Nothing shared with you"
                description="Projects others share with you will appear here."
              />
            ) : (
              <ul className="mt-2 flex flex-col gap-0.5">
                {sharedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    onRename={onRename}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>

        <div className="shrink-0 border-t border-surface-border p-3">
          <Button className="w-full rounded-xl" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
