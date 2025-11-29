import "server-only";
import { primaryDatabase } from "@/lib/firebase-admin";
import { prisma } from "@/lib/db";

export async function syncSessionData(sessionId: string) {
  if (!primaryDatabase) {
    console.error("Firebase Admin not initialized");
    return { success: false, error: "Firebase Admin not initialized" };
  }

  try {
    // 1. Fetch data from Firebase
    const sessionRef = primaryDatabase.ref(`sessions/${sessionId}`);
    const snapshot = await sessionRef.once("value");
    const data = snapshot.val();

    if (!data) {
      return { success: false, error: "No data found in Firebase" };
    }

    // 2. Sync Participants
    if (data.participants) {
      const participants = Object.values(data.participants) as any[];

      // We'll use a transaction to ensure consistency
      await prisma.$transaction(async (tx) => {
        for (const p of participants) {
          // Update isSelected status
          await tx.sessionParticipant.updateMany({
            where: {
              sessionId: sessionId,
              memberId: p.memberId,
            },
            data: {
              isSelected: p.isSelected,
            },
          });
        }
      });
    }

    // 3. Sync Generated Teams (Optional - primarily for history/audit if needed)
    // For now, we mainly care about participants and game results which are already handled
    // by server actions. This sync is a safety net for participant availability.

    return { success: true };
  } catch (error) {
    console.error("Error syncing session data:", error);
    return { success: false, error: error };
  }
}
