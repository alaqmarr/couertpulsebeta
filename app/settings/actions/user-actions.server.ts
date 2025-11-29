"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

export async function syncUserNameAction() {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const clerkUser = await prisma.clerkUser.findUnique({
    where: { id: user.clerkUserId ?? "" },
  });

  if (!clerkUser?.fullName) {
    throw new Error("Clerk user not found or has no name");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: clerkUser.fullName },
  });

  revalidatePath("/settings");
  return { updated: true, name: clerkUser.fullName };
}
