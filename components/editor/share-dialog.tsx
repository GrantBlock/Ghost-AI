"use client";

import { Check, Link2, X } from "lucide-react";
import type { FormEvent } from "react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectShare } from "@/hooks/use-project-share";

interface ShareDialogProps {
  projectId: string;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function initials(label: string) {
  return label.trim().charAt(0).toUpperCase() || "?";
}

export function ShareDialog({
  projectId,
  isOwner,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const share = useProjectShare(projectId, open);

  function handleInvite(event: FormEvent) {
    event.preventDefault();
    void share.invite();
  }

  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Share project"
      description={
        isOwner
          ? "Invite people by email. They can open this project once signed in."
          : "People with access to this project."
      }
      footer={
        <Button variant="outline" onClick={() => void share.copyLink()}>
          {share.copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {share.copied ? "Copied!" : "Copy link"}
        </Button>
      }
    >
      {isOwner ? (
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input
            type="email"
            value={share.email}
            onChange={(e) => share.setEmail(e.target.value)}
            placeholder="name@example.com"
            aria-label="Collaborator email"
            className="text-copy-primary placeholder:text-copy-faint"
          />
          <Button
            type="submit"
            disabled={share.email.trim().length === 0 || share.isSubmitting}
          >
            {share.isSubmitting ? "Inviting..." : "Invite"}
          </Button>
        </form>
      ) : null}

      {share.error ? (
        <p className="text-xs text-destructive">{share.error}</p>
      ) : null}

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-copy-secondary">
          Collaborators
        </h3>
        {share.isLoading ? (
          <p className="text-xs text-copy-muted">Loading...</p>
        ) : share.collaborators.length === 0 ? (
          <p className="text-xs text-copy-muted">No collaborators yet.</p>
        ) : (
          <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
            {share.collaborators.map((c) => (
              <li
                key={c.email}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5"
              >
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Clerk-hosted avatar URL
                  <img
                    src={c.imageUrl}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-medium text-copy-secondary">
                    {initials(c.name ?? c.email)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {c.name ? (
                    <p className="truncate text-sm text-copy-primary">
                      {c.name}
                    </p>
                  ) : null}
                  <p
                    className={
                      c.name
                        ? "truncate text-xs text-copy-muted"
                        : "truncate text-sm text-copy-primary"
                    }
                  >
                    {c.email}
                  </p>
                </div>
                {isOwner ? (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => void share.remove(c.email)}
                    disabled={share.removingEmail === c.email}
                    aria-label={`Remove ${c.email}`}
                    className="text-copy-muted hover:text-destructive"
                  >
                    <X />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </EditorDialog>
  );
}
