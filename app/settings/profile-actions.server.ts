"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

export async function updateBioAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const bio = formData.get("bio") as string;

  await prisma.user.update({
    where: { id: user.id },
    data: { bio },
  });

  revalidatePath("/settings");
  revalidatePath(`/player/${user.id}`);
}

// Deprecated: Use privacy settings from lib/player-privacy.ts instead
// export async function toggleProfileVisibilityAction() {
//   const user = await getOrCreateUser();
//   if (!user) throw new Error("Unauthorized");
//
//   const currentUser = await prisma.user.findUnique({
//     where: { id: user.id },
//     select: { isProfilePublic: true },
//   });
//
//   await prisma.user.update({
//     where: { id: user.id },
//     data: { isProfilePublic: !currentUser?.isProfilePublic },
//   });
//
//   revalidatePath("/settings");
//   revalidatePath(`/player/${user.id}`);
// }
