"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

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
  const diff = Math.abs(teamAScore - teamBScore);

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

    // 3) Update SessionPlayerStats (use upsert so missing rows are created)
    //    Assumes SessionPlayerStats has fields: plays, totalPoints (optional), pointDiff (optional)
    const updatePlayerStat = async (
      email: string,
      pointsScored: number,
      diffForPlayer: number
    ) => {
      await tx.sessionPlayerStats.upsert({
        where: { sessionId_player: { sessionId, player: email } },
        update: {
          plays: { increment: 1 },
          // only update these if you added them to the model
          ...(typeof pointsScored === "number"
            ? { totalPoints: { increment: pointsScored } }
            : {}),
          ...(typeof diffForPlayer === "number"
            ? { pointDiff: { increment: diffForPlayer } }
            : {}),
        },
        create: {
          sessionId,
          player: email,
          plays: 1,
          // create initial values if columns exist
          ...(typeof pointsScored === "number"
            ? { totalPoints: pointsScored }
            : {}),
          ...(typeof diffForPlayer === "number"
            ? { pointDiff: diffForPlayer }
            : {}),
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

    // 4) Optionally update team-level aggregates (gamesPlayed/gamesWon)
    await tx.team.update({
      where: { id: teamId },
      data: {
        gamesPlayed: { increment: 1 },
        gamesWon:
          winner === "A" || winner === "B"
            ? { increment: winner === "A" ? 1 : winner === "B" ? 1 : 0 } // careful: this is simple - better to increment appropriate counters per-team if you model them
            : undefined,
      },
    });
  });

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

  // 1️⃣ — Fetch session and validate owner
  const session = await prisma.session.findUnique({
    where: { slug: sessionSlug },
    include: {
      team: { select: { id: true, ownerId: true } },
      participants: {
        where: { isSelected: true },
        include: { member: { select: { email: true } } },
      },
    },
  });

  if (!session) throw new Error("Session not found.");
  if (session.team.ownerId !== user.id)
    throw new Error("Only the team owner can randomize matches.");

  // 2️⃣ — Validate available players
  const players = session.participants.map((p) => p.member.email);
  if (players.length < 2)
    throw new Error("At least two players are required to randomize.");

  const requiredPlayers = matchType === "SINGLES" ? 2 : 4;
  if (players.length < requiredPlayers)
    throw new Error(
      `Insufficient players for ${matchType}. Need ${requiredPlayers}, have ${players.length}.`
    );

  // 3️⃣ — Atomic transaction to ensure consistency
  await prisma.$transaction(async (tx) => {
    const sessionId = session.id;

    // --- Preload data ---
    const [usedPairs, playStats] = await Promise.all([
      tx.sessionPairHistory.findMany({ where: { sessionId } }),
      tx.sessionPlayerStats.findMany({ where: { sessionId } }),
    ]);

    const usedSet = new Set(
      usedPairs.map((p) => [p.playerA, p.playerB].sort().join("|"))
    );
    const playCount = new Map(playStats.map((p) => [p.player, p.plays]));

    // Initialize missing stats
    for (const player of players) {
      if (!playCount.has(player)) {
        await tx.sessionPlayerStats.create({
          data: { sessionId, player, plays: 0 },
        });
        playCount.set(player, 0);
      }
    }

    // 4️⃣ — Determine active vs resting players (if uneven)
    const minPlays = Math.min(...playCount.values());
    const sortedPlayers = [...players].sort(
      (a, b) => playCount.get(a)! - playCount.get(b)!
    );

    const activePlayers =
      players.length % requiredPlayers === 0
        ? [...players]
        : sortedPlayers.filter(
            (p) => playCount.get(p)! > minPlays // leave out least-played one
          );

    if (activePlayers.length < requiredPlayers)
      throw new Error(
        `Not enough eligible players to form a complete ${matchType} match.`
      );

    // 5️⃣ — Random fair pairing
    let teamAPlayers: string[];
    let teamBPlayers: string[];

    if (matchType === "SINGLES") {
      // Generate all possible unique matchups
      const combos: [string, string][] = [];
      for (let i = 0; i < activePlayers.length; i++) {
        for (let j = i + 1; j < activePlayers.length; j++) {
          combos.push([activePlayers[i], activePlayers[j]]);
        }
      }

      // Filter out used ones
      let available = combos.filter(
        (pair) => !usedSet.has(pair.sort().join("|"))
      );
      if (available.length === 0) {
        // Reset cycle if exhausted
        await tx.sessionPairHistory.deleteMany({ where: { sessionId } });
        available = combos;
      }

      const chosen = available[Math.floor(Math.random() * available.length)];
      teamAPlayers = [chosen[0]];
      teamBPlayers = [chosen[1]];

      await tx.sessionPairHistory.create({
        data: { sessionId, playerA: chosen[0], playerB: chosen[1] },
      });
    } else {
      // DOUBLES pairing
      if (activePlayers.length < 4)
        throw new Error("At least 4 players required for doubles pairing.");

      const pairs: [string, string][] = [];
      for (let i = 0; i < activePlayers.length; i++) {
        for (let j = i + 1; j < activePlayers.length; j++) {
          pairs.push([activePlayers[i], activePlayers[j]]);
        }
      }

      let availablePairs = pairs.filter(
        (p) => !usedSet.has(p.sort().join("|"))
      );
      if (availablePairs.length === 0) {
        await tx.sessionPairHistory.deleteMany({ where: { sessionId } });
        availablePairs = pairs;
      }

      const pairA = availablePairs[Math.floor(Math.random() * availablePairs.length)];
      const remaining = activePlayers.filter((p) => !pairA.includes(p));
      if (remaining.length < 2)
        throw new Error("Not enough remaining players to form opponent team.");

      const pairB = remaining.sort(() => Math.random() - 0.5).slice(0, 2);

      teamAPlayers = pairA;
      teamBPlayers = pairB;

      await tx.sessionPairHistory.create({
        data: { sessionId, playerA: pairA[0], playerB: pairA[1] },
      });
      await tx.sessionPairHistory.create({
        data: { sessionId, playerA: pairB[0], playerB: pairB[1] },
      });
    }

    // 6️⃣ — Enforce unique team members
    const overlap = teamAPlayers.some((p) => teamBPlayers.includes(p));
    if (overlap) throw new Error("Player overlap between Team A and Team B.");

    // 7️⃣ — Update session stats (upsert safe)
    for (const p of activePlayers) {
      await tx.sessionPlayerStats.upsert({
        where: { sessionId_player: { sessionId, player: p } },
        update: { plays: { increment: 1 } },
        create: { sessionId, player: p, plays: 1 },
      });
    }

    // 8️⃣ — Persist game atomically
    await tx.game.create({
      data: {
        slug: `${sessionSlug}-rnd-${Date.now()}`,
        sessionId,
        teamAPlayers,
        teamBPlayers,
      },
    });
  });

  // 9️⃣ — Revalidate path after transaction success
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
