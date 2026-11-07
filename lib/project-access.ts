import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface CurrentIdentity {
  userId: string;
  /** Primary email address, or null when the user has none. */
  email: string | null;
  /** Whether the primary email is verified (only verified emails grant shared access). */
  emailVerified: boolean;
}

export interface AccessibleProject {
  id: string;
  name: string;
  isOwner: boolean;
}

/** The signed-in Clerk identity (userId + primary email), or null when signed out. */
export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const primary =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
    null;

  return {
    userId,
    email: primary?.emailAddress ?? null,
    emailVerified: primary?.verification?.status === "verified",
  };
}

/**
 * Returns the project when the identity owns it or is a collaborator on it;
 * null when the project does not exist or the identity has no access.
 */
export async function getProjectIfAccessible(
  projectId: string,
  identity: CurrentIdentity
): Promise<AccessibleProject | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, ownerId: true },
  });
  if (!project) return null;

  const isOwner = project.ownerId === identity.userId;
  if (!isOwner) {
    if (!identity.email || !identity.emailVerified) return null;
    const collaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        email: { equals: identity.email, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (!collaborator) return null;
  }

  return { id: project.id, name: project.name, isOwner };
}
