"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addGalleryImageAction(
  tournamentId: string,
  imageUrl: string
) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { galleryImages: true },
    });

    if (!tournament) return { success: false, error: "Tournament not found" };

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        galleryImages: [...tournament.galleryImages, imageUrl],
      },
    });

    revalidatePath(`/tournament/${tournamentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add gallery image:", error);
    return { success: false, error: "Database error" };
  }
}
