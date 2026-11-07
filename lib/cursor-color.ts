/** Fixed palette of cursor colors. */
export const CURSOR_COLORS = [
  "#F87171", // red
  "#FB923C", // orange
  "#FBBF24", // amber
  "#A3E635", // lime
  "#34D399", // emerald
  "#22D3EE", // cyan
  "#60A5FA", // blue
  "#A78BFA", // violet
  "#F472B6", // pink
  "#E879F9", // fuchsia
] as const;

/** Deterministically maps a user ID to a color from the fixed palette. */
export function getCursorColor(userId: string): string {
  // FNV-1a hash: stable across runs and environments.
  let hash = 0x811c9dc5;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return CURSOR_COLORS[(hash >>> 0) % CURSOR_COLORS.length];
}
