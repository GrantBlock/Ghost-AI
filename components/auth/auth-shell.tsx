import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-base px-4 py-8 font-sans">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-surface-border bg-elevated text-lg font-bold text-copy-primary">
        G
      </span>
      {children}
    </main>
  );
}
