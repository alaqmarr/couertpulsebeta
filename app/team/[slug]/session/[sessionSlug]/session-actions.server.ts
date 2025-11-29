"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { primaryDatabase } from "@/lib/firebase-admin";
import { getOrCreateUser } from "@/lib/clerk";

/* =========================================================
   SUBMIT GAME SCORE
   ========================================================= */
export async function submitGameScoreAction(
  teamSlug: string,
  sessionSlug: string,
  gameSlug: string,
  teamAScore: number,
  teamBScore: number
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  // fetch game + session + team info
  const game = await prisma.game.findUnique({
    where: { slug: gameSlug },
    include: { session: { include: { team: true } } },
  });

  if (!game) throw new Error("Game not found");
  if (game.session.team.ownerId !== user.id)
    throw new Error("Only the team owner can submit scores.");
  if (game.winner) throw new Error("Scores already finalized for this match.");

  // compute winner / diff
  const winner: "A" | "B" | "DRAW" =
    teamAScore > teamBScore ? "A" : teamBScore > teamAScore ? "B" : "DRAW";

  const sessionId = game.sessionId;
  const teamId = game.session.teamId;

  await prisma.$transaction(async (tx) => {
    // 1) Update game with scores + winner (atomic)
    await tx.game.update({
      where: { slug: gameSlug },
      data: { teamAScore, teamBScore, winner },
    });

    // 2) Update pair stats (doubles) using upsert
    const upsertPairStat = async (emails: string[], didWin: boolean) => {
      if (emails.length !== 2) return;
      const [a, b] = emails.slice().sort(); // stable order for unique key
      await tx.pairStat.upsert({
        where: { teamId_playerA_playerB: { teamId, playerA: a, playerB: b } },
        update: {
          plays: { increment: 1 },
          wins: { increment: didWin ? 1 : 0 },
        },
        create: {
          teamId,
          playerA: a,
          playerB: b,
          plays: 1,
          wins: didWin ? 1 : 0,
        },
      });
    };

    if (game.teamAPlayers.length === 2) {
      await upsertPairStat(game.teamAPlayers, winner === "A");
    }
    if (game.teamBPlayers.length === 2) {
      await upsertPairStat(game.teamBPlayers, winner === "B");
    }

    // 3) Update SessionPlayerStats
    const updatePlayerStat = async (
      email: string,
      pointsScored: number,
      diffForPlayer: number
    ) => {
      await tx.sessionPlayerStats.upsert({
        where: { sessionId_player: { sessionId, player: email } },
        update: {
          plays: { increment: 1 },
          totalPoints: { increment: pointsScored },
          pointDiff: { increment: diffForPlayer },
        },
        create: {
          sessionId,
          player: email,
          plays: 1,
          totalPoints: pointsScored,
          pointDiff: diffForPlayer,
        },
      });
    };

    const diffForA = teamAScore - teamBScore;
    const diffForB = teamBScore - teamAScore;

    for (const email of game.teamAPlayers) {
      await updatePlayerStat(email, teamAScore, diffForA);
    }
    for (const email of game.teamBPlayers) {
      await updatePlayerStat(email, teamBScore, diffForB);
    }

    // 4) Optionally update team-level aggregates
    await tx.team.update({
      where: { id: teamId },
      data: {
        gamesPlayed: { increment: 1 },
        gamesWon:
          winner === "A" || winner === "B"
            ? { increment: winner === "A" ? 1 : winner === "B" ? 1 : 0 }
            : undefined,
      },
    });
  });

  // --- FIREBASE SYNC ---
  if (primaryDatabase) {
    await primaryDatabase.ref(`sessions/${sessionId}/games/${game.id}`).update({
      teamAScore,
      teamBScore,
      winner,
    });
  }
  // ---------------------

  revalidatePath(`/team/${teamSlug}/session/${sessionSlug}`);
}

/* =========================================================
   CREATE GAME (UI-Controlled Teams)
   ========================================================= */
export async function createGameAction(
  teamSlug: string,
  sessionSlug: string,
  matchType: "SINGLES" | "DOUBLES",
  teamAEmails: string[],
  teamBEmails: string[]
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const session = await prisma.session.findUnique({
    where: { slug: sessionSlug },
    include: {
      team: true,
      participants: { where: { isSelected: true }, include: { member: true } },
    },
  });

  if (!session) throw new Error("Session not found");
  if (session.team.ownerId !== user.id)
    throw new Error("Only the team owner can create games.");

  // Validation
  const required = matchType === "SINGLES" ? 1 : 2;
  if (
    teamAEmails.length !== required ||
    teamBEmails.length !== required ||
    teamAEmails.some((p) => teamBEmails.includes(p))
  ) {
    throw new Error("Invalid team configuration.");
  }

  const selected = session.participants.map((p) => p.member.email);
  const all = [...teamAEmails, ...teamBEmails];
  if (!all.every((e) => selected.includes(e)))
    throw new Error("All players must be marked as available.");

  const newGame = await prisma.game.create({
    data: {
      slug: `${sessionSlug}-game-${Date.now()}`,
      sessionId: session.id,
      teamAPlayers: teamAEmails,
      teamBPlayers: teamBEmails,
    },
  });

  // --- FIREBASE SYNC ---
  if (primaryDatabase) {
    await primaryDatabase
      .ref(`sessions/${session.id}/games/${newGame.id}`)
      .set({
        id: newGame.id,
        slug: newGame.slug,
        sessionId: session.id, // Added sessionId
        teamAPlayers: newGame.teamAPlayers,
        teamBPlayers: newGame.teamBPlayers,
        teamAScore: 0,
        teamBScore: 0,
        winner: null,
      });
  }
  // ---------------------

  revalidatePath(`/team/${teamSlug}/session/${sessionSlug}`);
}

/* =========================================================
   RANDOMIZE TEAMS
   ========================================================= */
export async function randomizeTeamsAction(
  teamSlug: string,
  sessionSlug: string,
  matchType: "SINGLES" | "DOUBLES"
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const session = await prisma.session.findUnique({
    where: { slug: sessionSlug },
    include: { participants: { include: { member: true } } },
  });

  if (!session) throw new Error("Session not found");

  // Get available players
  const availablePlayers = session.participants
    .filter((p) => p.isSelected)
    .map((p) => p.member.email);

  if (availablePlayers.length < (matchType === "SINGLES" ? 2 : 4)) {
    throw new Error("Not enough players selected");
  }

  // --- FAIR RANDOMIZATION ALGORITHM ---

  // 1. Fetch all games to calculate stats
  const games = await prisma.game.findMany({
    where: { sessionId: session.id },
    select: { teamAPlayers: true, teamBPlayers: true, winner: true },
  });

  // 2. Calculate play counts for available players
  const playCounts = new Map<string, number>();
  availablePlayers.forEach((email) => playCounts.set(email, 0));

  games.forEach((g) => {
    [...g.teamAPlayers, ...g.teamBPlayers].forEach((email) => {
      if (playCounts.has(email)) {
        playCounts.set(email, playCounts.get(email)! + 1);
      }
    });
  });

  // 3. Sort players by play count (Ascending), then random shuffle for ties
  const sortedPlayers = availablePlayers.sort((a, b) => {
    const countA = playCounts.get(a) || 0;
    const countB = playCounts.get(b) || 0;
    if (countA !== countB) return countA - countB;
    return 0.5 - Math.random();
  });

  // 4. Pick top N players
  const required = matchType === "SINGLES" ? 2 : 4;
  const selectedPlayers = sortedPlayers.slice(0, required);

  let teamA: string[] = [];
  let teamB: string[] = [];

  if (matchType === "SINGLES") {
    teamA = [selectedPlayers[0]];
    teamB = [selectedPlayers[1]];
  } else {
    // DOUBLES: Find best combination to minimize pair repetition
    const p = selectedPlayers;
    const combinations = [
      { a: [p[0], p[1]], b: [p[2], p[3]] }, // (0,1) vs (2,3)
      { a: [p[0], p[2]], b: [p[1], p[3]] }, // (0,2) vs (1,3)
      { a: [p[0], p[3]], b: [p[1], p[2]] }, // (0,3) vs (1,2)
    ];

    // Helper to check how many times a pair has played together
    const getPairRepetition = (p1: string, p2: string) => {
      let count = 0;
      const pair = [p1, p2].sort().join(",");
      games.forEach((g) => {
        const teamA = g.teamAPlayers.slice().sort().join(",");
        const teamB = g.teamBPlayers.slice().sort().join(",");
        if (teamA === pair || teamB === pair) count++;
      });
      return count;
    };

    // Score each combination (lower is better)
    const scoredCombinations = combinations.map((combo) => {
      const score =
        getPairRepetition(combo.a[0], combo.a[1]) +
        getPairRepetition(combo.b[0], combo.b[1]);
      return { ...combo, score };
    });

    // Sort by score (asc), then random shuffle for ties
    scoredCombinations.sort((x, y) => {
      if (x.score !== y.score) return x.score - y.score;
      return 0.5 - Math.random();
    });

    const best = scoredCombinations[0];
    teamA = best.a;
    teamB = best.b;
  }
  // ------------------------------------

  // Save to Firebase for instant UI update
  if (primaryDatabase) {
    await primaryDatabase.ref(`sessions/${session.id}/generatedTeams`).set({
      teamA,
      teamB,
      matchType,
      timestamp: Date.now(),
    });
  }

  return { success: true };
}

/* =========================================================
   TOGGLE PLAYER AVAILABILITY
   ========================================================= */
export async function togglePlayerAvailabilityAction(
  sessionSlug: string,
  memberId: string
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const session = await prisma.session.findUnique({
    where: { slug: sessionSlug },
    include: { team: true },
  });
  if (!session) throw new Error("Session not found");
  if (session.team.ownerId !== user.id)
    throw new Error("Only the owner can edit availability.");

  const existing = await prisma.sessionParticipant.findUnique({
    where: { sessionId_memberId: { sessionId: session.id, memberId } },
  });

  if (existing) {
    await prisma.sessionParticipant.update({
      where: { sessionId_memberId: { sessionId: session.id, memberId } },
      data: { isSelected: !existing.isSelected },
    });
  } else {
    await prisma.sessionParticipant.create({
      data: { sessionId: session.id, memberId, isSelected: true },
    });
  }

  revalidatePath(`/team/${session.team.slug}/session/${sessionSlug}`);
}

/* =========================================================
   MANUAL SYNC ACTION
   ========================================================= */
import { syncSessionData } from "@/lib/sync";
import { checkCapability } from "@/lib/permissions";

export async function syncSessionAction(sessionId: string) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  // Check if user has permission to sync
  checkCapability(user, "canSync");

  const result = await syncSessionData(sessionId);
  if (!result.success) {
    throw new Error(String(result.error));
  }

  return { success: true };
}
