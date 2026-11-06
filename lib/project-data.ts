import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Project } from "@/lib/projects";

export interface UserProjects {
  owned: Project[];
  shared: Project[];
}

/** Projects the signed-in user owns, plus projects shared with their email. */
export async function getUserProjects(): Promise<UserProjects> {
  const { userId } = await auth.protect();
  const user = await currentUser();
  // Only verified addresses grant access to shared projects.
  const emails = (user?.emailAddresses ?? [])
    .filter((e) => e.verification?.status === "verified")
    .map((e) => e.emailAddress);

  const [owned, shared] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    emails.length === 0
      ? Promise.resolve([])
      : prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: {
              some: { OR: emails.map((email) => ({ email: { equals: email, mode: "insensitive" as const } })) },
            },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true },
        }),
  ]);

  return {
    owned: owned.map((p) => ({ ...p, isOwner: true })),
    shared: shared.map((p) => ({ ...p, isOwner: false })),
  };
}
