"use client";

import { UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
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
      <div className="flex flex-1 items-center justify-center" />
      <div className="flex flex-1 items-center justify-end gap-2">
        <UserButton />
      </div>
    </header>
  );
}
