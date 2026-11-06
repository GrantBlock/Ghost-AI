import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface CollaboratorInfo {
  email: string;
  /** Clerk display name, or null when no Clerk user matches the email. */
  name: string | null;
  /** Clerk avatar URL, or null when no Clerk user matches the email. */
  imageUrl: string | null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Loose email shape check; Clerk remains the source of truth for real accounts. */
export function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Collaborators for a project, enriched with Clerk name + avatar by email. */
export async function listCollaborators(
  projectId: string
): Promise<CollaboratorInfo[]> {
  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { email: true },
  });
  if (rows.length === 0) return [];

  const byEmail = new Map<string, { name: string | null; imageUrl: string | null }>();
  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      emailAddress: rows.map((r) => r.email),
      limit: rows.length,
    });
    for (const user of users) {
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
      for (const address of user.emailAddresses) {
        byEmail.set(normalizeEmail(address.emailAddress), {
          name,
          imageUrl: user.imageUrl || null,
        });
      }
    }
  } catch (err) {
    // Enrichment is best-effort: fall back to email-only entries.
    console.error("Failed to enrich collaborators from Clerk", err);
  }

  return rows.map(({ email }) => ({
    email,
    name: byEmail.get(normalizeEmail(email))?.name ?? null,
    imageUrl: byEmail.get(normalizeEmail(email))?.imageUrl ?? null,
  }));
}
