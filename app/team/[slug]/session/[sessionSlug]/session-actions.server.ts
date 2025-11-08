"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

/* =========================================================
   CREATE GAME - Now accepts team assignments from UI
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
      participants: {
        where: { isSelected: true },
        include: { member: true },
      },
    },
  });
  
  if (!session) throw new Error("Session not found");
  if (session.team.ownerId !== user.id)
    throw new Error("Only the team owner can create games.");

  // Validate team sizes
  if (matchType === "SINGLES") {
    if (teamAEmails.length !== 1 || teamBEmails.length !== 1) {
      throw new Error("Singles matches require exactly 1 player per team.");
    }
  } else {
    if (teamAEmails.length !== 2 || teamBEmails.length !== 2) {
      throw new Error("Doubles matches require exactly 2 players per team.");
    }
  }

  // Ensure no overlap between teams
  if (teamAEmails.some((p) => teamBEmails.includes(p))) {
    throw new Error("A player cannot appear on both teams.");
  }

  // Verify all players are selected
  const selectedEmails = session.participants.map((p) => p.member.email);
  const allPlayers = [...teamAEmails, ...teamBEmails];
  if (!allPlayers.every((email) => selectedEmails.includes(email))) {
    throw new Error("All players must be marked as available.");
  }

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
      participants: {
        where: { isSelected: true },
        include: { member: true },
      },
    },
  });
  
  if (!session) throw new Error("Session not found");
  if (session.team.ownerId !== user.id)
    throw new Error("Only the team owner can randomize.");

  const availablePlayers = session.participants.map((p) => p.member.email);
  
  const requiredPlayers = matchType === "SINGLES" ? 2 : 4;
  if (availablePlayers.length < requiredPlayers) {
    throw new Error(`Not enough selected players. Need ${requiredPlayers}, have ${availablePlayers.length}.`);
  }

  // Shuffle all available players
  const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5);

  const teamAPlayers = matchType === "SINGLES" 
    ? [shuffled[0]] 
    : shuffled.slice(0, 2);
    
  const teamBPlayers = matchType === "SINGLES"
    ? [shuffled[1]]
    : shuffled.slice(2, 4);

  await prisma.game.create({
    data: {
      slug: `${sessionSlug}-random-${Date.now()}`,
      sessionId: session.id,
      teamAPlayers,
      teamBPlayers,
    },
  });

  revalidatePath(`/team/${teamSlug}/session/${sessionSlug}`);
}

/* =========================================================
   SET WINNER
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

  await prisma.game.update({
    where: { slug: gameSlug },
    data: { winner },
  });

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
      stat.plays += 1;
      if (
        (g.winner === "A" && g.teamAPlayers.includes(p)) ||
        (g.winner === "B" && g.teamBPlayers.includes(p))
      ) {
        stat.wins += 1;
      }
      tally.set(p, stat);
    }
  }

  const members = session.team.members;

  const leaderboard = Array.from(tally.entries()).map(([email, s]) => {
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
  });

  return leaderboard.sort(
    (a, b) => b.winRate - a.winRate || b.wins - a.wins || a.name.localeCompare(b.name)
  );
}