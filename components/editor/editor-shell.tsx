"use client";

import { Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

interface EditorShellProps {
  ownedProjects: Project[];
  sharedProjects: Project[];
  /** When set, renders the project workspace layout (name in navbar, AI sidebar placeholder). */
  projectName?: string;
  /** Current project (workspace only); enables the share dialog. */
  projectId?: string;
  /** Whether the viewer owns the current project (controls invite/remove). */
  isOwner?: boolean;
  /** Plain nodes (usable from server components) or a render function (client callers only). */
  children: ReactNode | ((actions: { openCreate: () => void }) => ReactNode);
}

/** Editor chrome (navbar, project sidebar, dialogs) wired to the project API. */
export function EditorShell({
  ownedProjects,
  sharedProjects,
  projectName,
  projectId,
  isOwner = false,
  children,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const actions = useProjectActions();

  return (
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        projectName={projectName}
        isAiOpen={isAiOpen}
        onToggleAi={() => setIsAiOpen((open) => !open)}
        onShare={() => setIsShareOpen(true)}
      />
      <div className="relative flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          onCreate={actions.openCreate}
          onRename={actions.openRename}
          onDelete={actions.openDelete}
        />
        {projectName ? (
          <div className="flex h-full">
            <main className="min-w-0 flex-1">{children as ReactNode}</main>
            <aside
              aria-label="AI assistant"
              aria-hidden={!isAiOpen}
              inert={!isAiOpen}
              className={cn(
                "shrink-0 overflow-hidden border-surface-border bg-surface transition-[width] duration-200 ease-out",
                isAiOpen ? "w-80 max-w-[85vw] border-l" : "w-0"
              )}
            >
              <div className="flex h-full w-80 max-w-[85vw] flex-col items-center justify-center gap-2 px-6 text-center">
                <Sparkles className="h-6 w-6 text-copy-faint" />
                <p className="text-sm font-medium text-copy-secondary">
                  AI assistant
                </p>
                <p className="text-xs text-copy-muted">
                  AI chat will appear here.
                </p>
              </div>
            </aside>
          </div>
        ) : typeof children === "function" ? (
          children({ openCreate: actions.openCreate })
        ) : (
          children
        )}
      </div>
      <ProjectDialogs state={actions} />
      {projectId ? (
        <ShareDialog
          projectId={projectId}
          isOwner={isOwner}
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
        />
      ) : null}
    </div>
  );
}
