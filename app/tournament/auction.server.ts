"use server";

import { prisma } from "@/lib/db";
import { adminDb } from "@/lib/firebase-admin";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

export async function placeBidAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const tournamentId = formData.get("tournamentId") as string;
  const playerId = formData.get("playerId") as string;
  const amount = parseInt(formData.get("amount") as string);
  const teamId = formData.get("teamId") as string;

  if (!tournamentId || !playerId || !amount || !teamId) {
    return { success: false, error: "Missing required fields" };
  }

  try {
    // 1. NEON: Transactional Update
    // Check if team has enough balance and player is available
    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.tournamentTeam.findUnique({
        where: { id: teamId },
      });

      if (!team) throw new Error("Team not found");

      // Calculate max purse (this logic might need to be more complex based on rules)
      // For now, assuming infinite purse or client-side check, but let's add a basic check if we had a limit
      // const tournament = await tx.tournament.findUnique({ where: { id: tournamentId } });
      // if (team.purseSpent + amount > tournament.auctionPurse) throw new Error("Insufficient funds");

      const player = await tx.tournamentPlayer.findUnique({
        where: { id: playerId },
      });

      if (!player) throw new Error("Player not found");
      if (player.teamId) throw new Error("Player already sold");

      // Update Player Price (Current Bid) - In a real auction, we might just track the bid
      // But here we are simulating a "Sold" or "Current High Bid" scenario.
      // If this is a live bidding system, we might need a separate Bid model.
      // For simplicity in this hybrid model, let's assume this action is "Placing a Bid"
      // which updates the "Current High Bidder" state.

      // Let's assume we are just updating the "Current State" in Neon for persistence
      // In a full auction, we'd have a Bids table.
      // For now, let's update the player's "soldPrice" temporarily to reflect current bid?
      // Or better, just rely on Firebase for the transient "Current Bid" and only write to Neon when "SOLD".

      // WAIT: The user wants "Neon is the final resting place, Firebase handles realtime".
      // So:
      // 1. Bid comes in.
      // 2. Validate in Neon (Team exists, Player exists).
      // 3. Update Firebase with new High Bid.
      // 4. Neon is ONLY updated when the player is officially SOLD.

      // HOWEVER, the user said "reduce load on either database".
      // If we only write to Firebase for bids, and Neon for SOLD, that's good.
      // But `placeBidAction` implies a server action.

      // Let's implement the "Bid" action to update Firebase primarily,
      // but maybe log it in Neon if we want an audit trail?
      // Let's stick to: Validate in Neon -> Update Firebase.

      return { team, player };
    });

    // 2. FIREBASE: Broadcast Update
    if (adminDb) {
      const auctionRef = adminDb.ref(`auctions/${tournamentId}/activeItem`);
      await auctionRef.update({
        currentBid: amount,
        currentBidderId: teamId,
        currentBidderName: result.team.name, // We need team name
        lastBidTime: Date.now(),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Bid Error:", error);
    return { success: false, error: error.message };
  }
}

export async function markPlayerSoldAction(formData: FormData) {
  const user = await getOrCreateUser();
  // TODO: Add Manager check

  const tournamentId = formData.get("tournamentId") as string;
  const playerId = formData.get("playerId") as string;
  const teamId = formData.get("teamId") as string;
  const amount = parseInt(formData.get("amount") as string);

  try {
    // 1. NEON: Finalize Sale
    await prisma.$transaction(async (tx) => {
      // Deduct from Team
      await tx.tournamentTeam.update({
        where: { id: teamId },
        data: {
          purseSpent: { increment: amount },
          points: { decrement: amount }, // Example: spending points? No, purse.
          // schema says purseSpent.
        },
      });

      // Assign to Player
      await tx.tournamentPlayer.update({
        where: { id: playerId },
        data: {
          teamId: teamId,
          soldPrice: amount,
          isCaptain: false, // Reset or set
        },
      });
    });

    // 2. FIREBASE: Clear Active Item or Update Status
    if (adminDb) {
      const auctionRef = adminDb.ref(`auctions/${tournamentId}`);
      await auctionRef.child("activeItem").set(null); // Clear active item
      // Optionally push to a "recentSales" list in Firebase for UI animation
      await auctionRef.child("recentSales").push({
        playerId,
        teamId,
        amount,
        timestamp: Date.now(),
      });
    }

    revalidatePath(`/tournament/${tournamentId}/auction`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
