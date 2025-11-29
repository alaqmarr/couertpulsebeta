"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function checkInPlayerAction(
  tournamentId: string,
  userId: string
) {
  try {
    // Verify player exists in tournament
    const player = await prisma.tournamentPlayer.findFirst({
      where: {
        tournamentId,
        userId,
      },
    });

    if (!player) {
      return { success: false, error: "Player not found in this tournament" };
    }

    if (player.isCheckedIn) {
      return { success: true, message: "Player already checked in", player };
    }

    // Update check-in status
    const updatedPlayer = await prisma.tournamentPlayer.update({
      where: { id: player.id },
      data: {
        isCheckedIn: true,
        checkInTime: new Date(),
      },
      include: {
        user: true,
        team: true,
      },
    });

    revalidatePath(`/tournament/${tournamentId}`);
    return {
      success: true,
      message: "Check-in successful",
      player: updatedPlayer,
    };
  } catch (error) {
    console.error("Check-in error:", error);
    return { success: false, error: "Failed to check in player" };
  }
}
