import "server-only";

import { Liveblocks } from "@liveblocks/node";

let cached: Liveblocks | null = null;

/**
 * Cached Liveblocks node client. Lazily created so a missing secret key does
 * not fail at build time, only when the client is actually used.
 */
export function getLiveblocks(): Liveblocks {
  if (cached) return cached;

  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }

  cached = new Liveblocks({ secret });
  return cached;
}
