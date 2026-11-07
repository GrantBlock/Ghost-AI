export interface Project {
  id: string;
  name: string;
  /** True when the current user owns the project; false for shared/collaborator projects. */
  isOwner: boolean;
}

export const DEFAULT_PROJECT_SLUG = "untitled-project";

/** Valid project / Liveblocks room IDs: lowercase alphanumerics separated by single hyphens. */
export const PROJECT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_PROJECT_ID_LENGTH = 120;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Short random lowercase-alphanumeric suffix used to make room IDs unique. */
export function generateIdSuffix(length = 6): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

/** Builds the project ID, which is also the Liveblocks room ID. */
export function buildRoomId(name: string, suffix: string): string {
  const slug = slugify(name).slice(0, 80).replace(/-+$/g, "") || DEFAULT_PROJECT_SLUG;
  return `${slug}-${suffix}`;
}
