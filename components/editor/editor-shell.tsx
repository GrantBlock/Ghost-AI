"use client";

import { useState, type ReactNode } from "react";

import { AiSidebar } from "@/components/editor/ai-sidebar";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import {
  SAVE_CANVAS_EVENT,
  SaveStatusProvider,
  type SaveStatus,
} from "@/components/editor/save-status";
import { ShareDialog } from "@/components/editor/share-dialog";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { IMPORT_TEMPLATE_EVENT } from "@/components/editor/starter-templates";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { Project } from "@/lib/projects";

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
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const actions = useProjectActions();

  return (
    <SaveStatusProvider value={setSaveStatus}>
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        projectName={projectName}
        isAiOpen={isAiOpen}
        onToggleAi={() => setIsAiOpen((open) => !open)}
        onShare={() => setIsShareOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onSave={() => window.dispatchEvent(new Event(SAVE_CANVAS_EVENT))}
        saveStatus={saveStatus}
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
          <div className="h-full">
            <main className="h-full min-w-0">{children as ReactNode}</main>
            <AiSidebar
              isOpen={isAiOpen}
              onClose={() => setIsAiOpen(false)}
              projectId={projectId}
            />
          </div>
        ) : typeof children === "function" ? (
          children({ openCreate: actions.openCreate })
        ) : (
          children
        )}
      </div>
      <ProjectDialogs state={actions} />
      {projectName ? (
        <StarterTemplatesModal
          open={isTemplatesOpen}
          onOpenChange={setIsTemplatesOpen}
          onImport={(template) =>
            window.dispatchEvent(
              new CustomEvent(IMPORT_TEMPLATE_EVENT, { detail: template })
            )
          }
        />
      ) : null}
      {projectId ? (
        <ShareDialog
          projectId={projectId}
          isOwner={isOwner}
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
        />
      ) : null}
    </div>
    </SaveStatusProvider>
  );
}
