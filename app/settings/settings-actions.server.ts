"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

export async function updateDisplayNameAction(
  teamMemberId: string,
  newName: string
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.teamMember.update({
    where: { id: teamMemberId },
    data: { displayName: newName },
  });

  revalidatePath("/settings");
}
