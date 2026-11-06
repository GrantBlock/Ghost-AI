import type { ReactNode } from "react";

const FEATURES = [
  "Real-time collaborative canvas",
  "AI-generated architecture specs",
  "Share projects with your team",
];

function Logo() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-elevated text-lg font-bold text-copy-primary">
      G
    </span>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen bg-base font-sans">
      <aside className="hidden w-1/2 max-w-xl flex-col justify-center gap-6 border-r border-surface-border bg-surface px-12 lg:flex">
        <Logo />
        <h1 className="text-2xl font-semibold text-copy-primary">
          Design system architecture with your team.
        </h1>
        <ul className="flex flex-col gap-2 text-sm text-copy-secondary">
          {FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </aside>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        {children}
      </div>
    </main>
  );
}
