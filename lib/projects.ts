export interface Project {
  id: string;
  name: string;
  slug: string;
  /** True when the current user owns the project; false for shared/collaborator projects. */
  isOwner: boolean;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Mock data only — replaced by real data once persistence exists. */
export const MOCK_PROJECTS: Project[] = [
  { id: "p1", name: "Payments Platform", slug: "payments-platform", isOwner: true },
  { id: "p2", name: "Realtime Chat", slug: "realtime-chat", isOwner: true },
  { id: "p3", name: "Analytics Pipeline", slug: "analytics-pipeline", isOwner: false },
];
