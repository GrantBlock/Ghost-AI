"use client";

import { UserButton } from "@clerk/nextjs";
import {
  AlertCircle,
  Check,
  LayoutTemplate,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Share2,
  Sparkles,
} from "lucide-react";

import type { SaveStatus } from "@/components/editor/save-status";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  /** When set, the navbar shows the project name and workspace actions. */
  projectName?: string;
  isAiOpen?: boolean;
  onToggleAi?: () => void;
  onShare?: () => void;
  onOpenTemplates?: () => void;
  /** Flushes pending canvas changes immediately. */
  onSave?: () => void;
  saveStatus?: SaveStatus;
}

const SAVE_LABELS: Record<SaveStatus, string> = {
  idle: "Save",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

function SaveIcon({ status }: { status: SaveStatus }) {
  if (status === "saving") return <Loader2 className="h-4 w-4 animate-spin" />;
  if (status === "saved") return <Check className="h-4 w-4 text-state-success" />;
  if (status === "error") return <AlertCircle className="h-4 w-4 text-state-error" />;
  return <Save className="h-4 w-4" />;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  isAiOpen = false,
  onToggleAi,
  onShare,
  onOpenTemplates,
  onSave,
  saveStatus = "idle",
}: EditorNavbarProps) {
  const ToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;
  const label = isSidebarOpen ? "Close sidebar" : "Open sidebar";

  return (
    <header className="relative z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-surface-border bg-base px-3">
      <div className="flex flex-1 items-center justify-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={label}
          aria-expanded={isSidebarOpen}
          className="text-copy-muted hover:text-copy-primary"
        >
          <ToggleIcon className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center px-2">
        {projectName ? (
          <h1 className="max-w-full truncate text-sm font-semibold text-copy-primary">
            {projectName}
          </h1>
        ) : null}
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        {projectName ? (
          <>
            {onOpenTemplates ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={onOpenTemplates}
              >
                <LayoutTemplate className="h-4 w-4" />
                Templates
              </Button>
            ) : null}
            {onSave ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={onSave}
                disabled={saveStatus === "saving"}
                aria-live="polite"
              >
                <SaveIcon status={saveStatus} />
                {SAVE_LABELS[saveStatus]}
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={onShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            {onToggleAi ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleAi}
                aria-label={isAiOpen ? "Close AI sidebar" : "Open AI sidebar"}
                aria-expanded={isAiOpen}
                className="text-copy-muted hover:text-copy-primary"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            ) : null}
          </>
        ) : null}
        <UserButton />
      </div>
    </header>
  );
}
