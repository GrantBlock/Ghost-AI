"use client";

import type { FormEvent } from "react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { useProjectDialogs } from "@/hooks/use-project-dialogs";

type ProjectDialogsState = ReturnType<typeof useProjectDialogs>;

interface ProjectDialogsProps {
  state: ProjectDialogsState;
}

/** Create / Rename / Delete project dialogs, driven by useProjectDialogs. */
export function ProjectDialogs({ state }: ProjectDialogsProps) {
  const { dialog, targetProject, name, setName, slug, isLoading, close, submit } =
    state;

  const canSubmit = name.trim().length > 0 && !isLoading;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  return (
    <>
      <EditorDialog
        open={dialog === "create"}
        onOpenChange={(open) => !open && close()}
        title="Create project"
        description="Give your new architecture workspace a name."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              aria-label="Project name"
              autoFocus
              className="text-copy-primary placeholder:text-copy-faint"
            />
            <p className="text-xs text-copy-muted">
              Slug:{" "}
              <span className="text-copy-secondary">{slug || "your-project"}</span>
            </p>
          </div>
          <div className="-mx-6 -mb-6 flex justify-end gap-2 rounded-b-3xl border-t border-surface-border bg-elevated p-4">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </EditorDialog>

      <EditorDialog
        open={dialog === "rename"}
        onOpenChange={(open) => !open && close()}
        title="Rename project"
        description={
          targetProject ? `Current name: ${targetProject.name}` : undefined
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            aria-label="Project name"
            autoFocus
            className="text-copy-primary placeholder:text-copy-faint"
          />
          <div className="-mx-6 -mb-6 flex justify-end gap-2 rounded-b-3xl border-t border-surface-border bg-elevated p-4">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isLoading ? "Saving..." : "Rename"}
            </Button>
          </div>
        </form>
      </EditorDialog>

      <EditorDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && close()}
        title="Delete project"
        description={
          targetProject
            ? `Are you sure you want to delete "${targetProject.name}"? This action cannot be undone.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void submit()}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      />
    </>
  );
}
