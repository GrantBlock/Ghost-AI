import { Lock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-surface-border bg-surface text-copy-muted">
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="text-xl font-semibold text-copy-primary">Access denied</h1>
      <p className="max-w-sm text-sm text-copy-muted">
        This project doesn&apos;t exist or you don&apos;t have permission to
        view it.
      </p>
      <Button
        className="rounded-xl"
        nativeButton={false}
        render={<Link href="/editor" />}
      >
        Back to projects
      </Button>
    </main>
  );
}
