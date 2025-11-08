// lib/clerk.ts
import { prisma } from "./db";
import { currentUser } from "@clerk/nextjs/server";

/**
 * getOrCreateUser
 * Ensures ClerkUser and internal User records exist, are linked, and remain in sync.
 * Automatically creates a ClerkUser row if the user is logged in but missing in DB.
 * Never overwrites gameplay stats or historical data.
 */
export async function getOrCreateUser() {
  const clerk = await currentUser();
  if (!clerk) return null;

  const email =
    clerk.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? null;
  if (!email) throw new Error("Missing email on Clerk user");

  // --- 1) Ensure ClerkUser record exists immediately ---
  let clerkUser = await prisma.clerkUser.findUnique({
    where: { id: clerk.id },
  });

  if (!clerkUser) {
    clerkUser = await prisma.clerkUser.create({
      data: {
        id: clerk.id,
        clerkId: clerk.id,
        email,
        fullName: clerk.fullName ?? null,
        imageUrl: clerk.imageUrl ?? null,
        lastSyncedAt: new Date(),
      },
    });
  } else {
    const shouldUpdate =
      clerkUser.email !== email ||
      clerkUser.fullName !== clerk.fullName ||
      clerkUser.imageUrl !== clerk.imageUrl;

    if (shouldUpdate) {
      clerkUser = await prisma.clerkUser.update({
        where: { id: clerk.id },
        data: {
          email,
          fullName: clerk.fullName ?? null,
          imageUrl: clerk.imageUrl ?? null,
          lastSyncedAt: new Date(),
        },
      });
    }
  }

  // --- 2) Ensure internal User record exists and links properly ---
  let appUser = await prisma.user.findFirst({
    where: {
      OR: [{ clerkUserId: clerkUser.id }, { email }],
    },
  });

  // Create if missing
  if (!appUser) {
    appUser = await prisma.user.create({
      data: {
        clerkUserId: clerkUser.id,
        email,
        name: clerk.fullName ?? email.split("@")[0],
        image: clerk.imageUrl ?? null,
        packageType: "FREE",
        teamQuota: 1,
        tournamentQuota: 1,
      },
    });

    // link back to ensure referential consistency
    await prisma.clerkUser.update({
      where: { id: clerkUser.id },
      data: { appUser: { connect: { id: appUser.id } } },
    });
  } else {
    // If linked incorrectly, repair the association
    if (appUser.clerkUserId !== clerkUser.id) {
      appUser = await prisma.user.update({
        where: { id: appUser.id },
        data: { clerkUserId: clerkUser.id },
      });
    }

    // Basic info sync (non-destructive)
    const updateNeeded =
      appUser.email !== email ||
      (clerk.fullName && appUser.name !== clerk.fullName) ||
      (clerk.imageUrl && appUser.image !== clerk.imageUrl);

    if (updateNeeded) {
      appUser = await prisma.user.update({
        where: { id: appUser.id },
        data: {
          email,
          name: clerk.fullName ?? appUser.name,
          image: clerk.imageUrl ?? appUser.image,
        },
      });
    }
  }

  return appUser;
}

/**
 * syncClerkUser
 * Keeps ClerkUser and User models synchronized when Clerk sends webhook updates.
 */
export async function syncClerkUser(clerkId: string) {
  const clerkUser = await prisma.clerkUser.findUnique({
    where: { id: clerkId },
  });
  if (!clerkUser) return null;

  const appUser = await prisma.user.findFirst({
    where: { clerkUserId: clerkId },
  });
  if (!appUser) return null;

  return prisma.user.update({
    where: { id: appUser.id },
    data: {
      email: clerkUser.email,
      name: clerkUser.fullName ?? appUser.name,
      image: clerkUser.imageUrl ?? appUser.image,
    },
  });
}
