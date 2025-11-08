"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

export async function updateDisplayNameAction(
  memberId: string,
  newName: string
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");
  if (!newName.trim()) throw new Error("Display name cannot be empty");

  const membership = await prisma.teamMember.findUnique({
    where: { id: memberId },
    include: { team: true },
  });
  if (!membership) throw new Error("Team membership not found.");
  if (membership.userId !== user.id)
    throw new Error("You are not authorized to update this display name.");

  await prisma.teamMember.update({
    where: { id: memberId },
    data: { displayName: newName },
  });

  revalidatePath("/settings");
}
