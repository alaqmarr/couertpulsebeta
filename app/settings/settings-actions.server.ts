"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

/* =========================================================
   SYNC USER NAME BETWEEN APP AND CLERK
   ========================================================= */
export async function syncUserNameAction() {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");
  if (!user.clerkUserId) throw new Error("Linked Clerk user not found.");

  const clerkUser = await prisma.clerkUser.findUnique({
    where: { id: user.clerkUserId },
  });
  if (!clerkUser) throw new Error("Clerk user record missing.");

  const appName = (user.name ?? "").trim();
  const clerkName = (clerkUser.fullName ?? "").trim();

  if (!clerkName) throw new Error("Clerk name not available to sync.");
  if (appName === clerkName)
    return { updated: false, name: appName, status: "Already Synced" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { name: clerkName },
    }),
    prisma.clerkUser.update({
      where: { id: clerkUser.id },
      data: { lastSyncedAt: new Date() },
    }),
    prisma.teamMember.updateMany({
      where: { userId: user.id },
      data: { displayName: clerkName },
    }),
  ]);

  revalidatePath("/settings");
  revalidatePath("/teams");
  revalidatePath("/dashboard");

  return { updated: true, name: clerkName, status: "Synced Successfully" };
}

/* =========================================================
   UPDATE DISPLAY NAME FOR SPECIFIC TEAM
   ========================================================= */
export async function updateDisplayNameAction(
  memberId: string,
  newName: string
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const trimmed = newName.trim();
  if (!trimmed) throw new Error("Display name cannot be empty.");

  const membership = await prisma.teamMember.findUnique({
    where: { id: memberId },
    include: { team: true },
  });
  if (!membership) throw new Error("Team membership not found.");
  if (membership.userId !== user.id)
    throw new Error("Unauthorized: cannot edit another user's display name.");

  await prisma.teamMember.update({
    where: { id: memberId },
    data: { displayName: trimmed },
  });

  revalidatePath("/settings");
  revalidatePath(`/team/${membership.team.slug}`);

  return { updated: true, name: trimmed, team: membership.team.name };
}
