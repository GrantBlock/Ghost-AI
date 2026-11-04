"use client";

import type { ComponentProps, ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface EditorDialogProps
  extends Pick<ComponentProps<typeof Dialog>, "open" | "onOpenChange"> {
  title: string;
  description?: string;
  /** Dialog body content. */
  children?: ReactNode;
  /** Footer actions, e.g. Cancel / Confirm buttons. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Shared dialog pattern for editor modals: title, description, body, and
 * footer actions, styled with the project color tokens.
 */
export function EditorDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: EditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-5 rounded-3xl border border-surface-border bg-surface p-6 text-copy-primary ring-0 backdrop-blur-xl sm:max-w-md",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-copy-primary">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-copy-muted">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
        {footer ? (
          <DialogFooter className="-mx-6 -mb-6 rounded-b-3xl border-surface-border bg-elevated p-4">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
