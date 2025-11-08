"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

export async function syncUserNameAction() {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  if (!user.clerkUserId) throw new Error("Linked Clerk user not found.");

  const clerkUser = await prisma.clerkUser.findUnique({
    where: { id: user.clerkUserId },
  });
  if (!clerkUser) throw new Error("Clerk user record missing.");

  const appName = user.name?.trim() ?? "";
  const clerkName = clerkUser.fullName?.trim() ?? "";

  if (!clerkName) throw new Error("Clerk name not available to sync.");

  if (appName === clerkName) {
    return { updated: false, name: appName };
  }

  // 1. Update main user
  await prisma.user.update({
    where: { id: user.id },
    data: { name: clerkName },
  });

  // 2. Update ClerkUser sync timestamp
  await prisma.clerkUser.update({
    where: { id: clerkUser.id },
    data: { lastSyncedAt: new Date() },
  });

  // 3. Cascade to all team memberships for this user
  await prisma.teamMember.updateMany({
    where: { userId: user.id },
    data: { displayName: clerkName },
  });

  // 4. Revalidate paths to ensure fresh UI everywhere
  revalidatePath("/dashboard");
  revalidatePath("/teams");
  revalidatePath("/profile");
  revalidatePath("/");

  return { updated: true, name: clerkName };
}
