"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

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

  await prisma.game.create({
    data: {
      slug: `${sessionSlug}-game-${Date.now()}`,
      sessionId: session.id,
      teamAPlayers: teamAEmails,
      teamBPlayers: teamBEmails,
    },
  });

  revalidatePath(`/team/${teamSlug}/session/${sessionSlug}`);
}

/* =========================================================
   RANDOMIZE TEAMS
   ========================================================= */
/* =========================================================
   RANDOMIZE TEAMS — Fair Rotation (No Pair Repeat Within Session)
   ========================================================= */
/* =========================================================
   RANDOMIZE TEAMS — Fair Rotation with Odd Player Handling
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
    include: {
      team: true,
      participants: { where: { isSelected: true }, include: { member: true } },
    },
  });
  if (!session) throw new Error("Session not found");
  if (session.team.ownerId !== user.id)
    throw new Error("Only the team owner can randomize.");

  const sessionId = session.id;
  const players = session.participants.map((p) => p.member.email);
  const totalPlayers = players.length;

  if (totalPlayers < 2)
    throw new Error("Need at least 2 players to create a match.");

  const required = matchType === "SINGLES" ? 2 : 4;
  if (totalPlayers < required)
    throw new Error(`Need ${required} players, have ${totalPlayers}.`);

  // Fetch prior data
  const usedPairs = await prisma.sessionPairHistory.findMany({
    where: { sessionId },
  });
  const usedSet = new Set(
    usedPairs.map((p) => [p.playerA, p.playerB].sort().join("|"))
  );

  const playStats = await prisma.sessionPlayerStats.findMany({
    where: { sessionId },
  });
  const playCountMap = new Map(playStats.map((p) => [p.player, p.plays]));

  // Initialize missing player stats
  for (const player of players) {
    if (!playCountMap.has(player)) {
      await prisma.sessionPlayerStats.create({
        data: { sessionId, player, plays: 0 },
      });
      playCountMap.set(player, 0);
    }
  }

  // Determine who plays and who rests this round (if odd count)
  const minPlays = Math.min(...playCountMap.values());
  const availablePlayers = [...players].sort((a, b) => {
    return playCountMap.get(a)! - playCountMap.get(b)!;
  });

  let activePlayers: string[];
  let restingPlayer: string | null = null;

  if (totalPlayers % required !== 0) {
    restingPlayer = availablePlayers.find(
      (p) => playCountMap.get(p)! === minPlays
    )!;
    activePlayers = players.filter((p) => p !== restingPlayer);
  } else {
    activePlayers = players;
  }

  const shuffled = [...activePlayers].sort(() => Math.random() - 0.5);

  let teamAPlayers: string[];
  let teamBPlayers: string[];

  if (matchType === "SINGLES") {
    // Find a new matchup not seen before
    const allMatchups: [string, string][] = [];
    for (let i = 0; i < activePlayers.length; i++) {
      for (let j = i + 1; j < activePlayers.length; j++) {
        allMatchups.push([activePlayers[i], activePlayers[j]]);
      }
    }

    const remaining = allMatchups.filter(
      (m) => !usedSet.has(m.sort().join("|"))
    );
    let chosen: [string, string];

    if (remaining.length > 0) {
      chosen = remaining[Math.floor(Math.random() * remaining.length)];
    } else {
      // Reset when all combos used
      await prisma.sessionPairHistory.deleteMany({ where: { sessionId } });
      chosen = allMatchups[Math.floor(Math.random() * allMatchups.length)];
    }

    teamAPlayers = [chosen[0]];
    teamBPlayers = [chosen[1]];

    // Record pairing
    await prisma.sessionPairHistory.create({
      data: { sessionId, playerA: chosen[0], playerB: chosen[1] },
    });
  } else {
    // DOUBLES fair pairing
    const allPairs: [string, string][] = [];
    for (let i = 0; i < activePlayers.length; i++) {
      for (let j = i + 1; j < activePlayers.length; j++) {
        allPairs.push([activePlayers[i], activePlayers[j]]);
      }
    }

    const remaining = allPairs.filter(
      (pair) => !usedSet.has(pair.sort().join("|"))
    );
    let pairA: [string, string];

    if (remaining.length > 0) {
      pairA = remaining[Math.floor(Math.random() * remaining.length)];
    } else {
      await prisma.sessionPairHistory.deleteMany({ where: { sessionId } });
      pairA = allPairs[Math.floor(Math.random() * allPairs.length)];
    }

    const remainingForOpponents = activePlayers.filter(
      (p) => !pairA.includes(p)
    );
    const shuffledOpponents = [...remainingForOpponents].sort(
      () => Math.random() - 0.5
    );
    const pairB = shuffledOpponents.slice(0, 2);

    teamAPlayers = pairA;
    teamBPlayers = pairB;

    // Record both pairs
    await prisma.sessionPairHistory.create({
      data: { sessionId, playerA: pairA[0], playerB: pairA[1] },
    });
    await prisma.sessionPairHistory.create({
      data: { sessionId, playerA: pairB[0], playerB: pairB[1] },
    });
  }

  // Update play counts
  for (const p of activePlayers) {
    await prisma.sessionPlayerStats.update({
      where: { sessionId_player: { sessionId, player: p } },
      data: { plays: { increment: 1 } },
    });
  }

  // Create game
  await prisma.game.create({
    data: {
      slug: `${sessionSlug}-balanced-${Date.now()}`,
      sessionId,
      teamAPlayers,
      teamBPlayers,
    },
  });

  revalidatePath(`/team/${teamSlug}/session/${sessionSlug}`);
}

/* =========================================================
   SET WINNER + Update Pair Stats
   ========================================================= */
export async function setGameWinnerAction(
  teamSlug: string,
  sessionSlug: string,
  gameSlug: string,
  winner: "A" | "B"
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const game = await prisma.game.findUnique({
    where: { slug: gameSlug },
    include: { session: { include: { team: true } } },
  });

  if (!game) throw new Error("Game not found.");
  if (game.session.team.ownerId !== user.id)
    throw new Error("Only the team owner can mark results.");
  if (game.winner) throw new Error("Winner already set.");

  const updated = await prisma.game.update({
    where: { slug: gameSlug },
    data: { winner },
    include: { session: true },
  });

  const teamId = updated.session.teamId;

  // =========================================================
  // UPDATE PAIR STATS (Only for doubles)
  // =========================================================
  async function updatePairStats(pairEmails: string[], didWin: boolean) {
    if (pairEmails.length !== 2) return;

    const [a, b] = pairEmails.sort();
    const pair = await prisma.pairStat.upsert({
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
    return pair;
  }

  if (updated.teamAPlayers.length === 2)
    await updatePairStats(updated.teamAPlayers, updated.winner === "A");
  if (updated.teamBPlayers.length === 2)
    await updatePairStats(updated.teamBPlayers, updated.winner === "B");

  revalidatePath(`/team/${teamSlug}/session/${sessionSlug}`);
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
   SESSION LEADERBOARD
   ========================================================= */
export async function getSessionLeaderboard(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      games: true,
      team: {
        include: {
          members: { include: { user: true } },
        },
      },
    },
  });

  if (!session) throw new Error("Session not found.");

  const tally = new Map<string, { plays: number; wins: number }>();

  for (const g of session.games) {
    const allPlayers = [...g.teamAPlayers, ...g.teamBPlayers];
    for (const p of allPlayers) {
      const stat = tally.get(p) || { plays: 0, wins: 0 };
      stat.plays++;
      if (
        (g.winner === "A" && g.teamAPlayers.includes(p)) ||
        (g.winner === "B" && g.teamBPlayers.includes(p))
      )
        stat.wins++;
      tally.set(p, stat);
    }
  }

  const members = session.team.members;

  return Array.from(tally.entries())
    .map(([email, s]) => {
      const member = members.find((m) => m.email === email);
      const name =
        member?.displayName || member?.user?.name || email.split("@")[0];
      const losses = s.plays - s.wins;
      const winRate = s.plays > 0 ? (s.wins / s.plays) * 100 : 0;
      return {
        id: member?.id ?? email,
        name,
        plays: s.plays,
        wins: s.wins,
        losses,
        winRate,
      };
    })
    .sort(
      (a, b) =>
        b.winRate - a.winRate || b.wins - a.wins || a.name.localeCompare(b.name)
    );
}
