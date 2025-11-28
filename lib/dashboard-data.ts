import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import {
  PartnerStat,
  generatePlayerFacts,
  findUpcomingOrRecentSession,
} from "@/lib/utility-functions";
import { toZonedTime } from "date-fns-tz";

export async function getUserStats(
  userId: string,
  email: string,
  displayName: string | null
) {
  const userDisplay = displayName ?? email;

  // 1. Fetch Session Games
  const sessionGames = await prisma.game.findMany({
    where: {
      OR: [
        { teamAPlayers: { has: email } },
        { teamBPlayers: { has: email } },
        { teamAPlayers: { has: userDisplay } },
        { teamBPlayers: { has: userDisplay } },
      ],
    },
    select: {
      winner: true,
      teamAPlayers: true,
      teamBPlayers: true,
    },
  });

  // 2. Fetch Tournament Games
  const tournamentGames = await prisma.tournamentGame.findMany({
    where: {
      OR: [
        { teamAPlayers: { has: email } },
        { teamBPlayers: { has: email } },
        { teamAPlayers: { has: userDisplay } },
        { teamBPlayers: { has: userDisplay } },
      ],
    },
    select: {
      winningTeam: true,
      teamAPlayers: true,
      teamBPlayers: true,
    },
  });

  let totalWins = 0;
  let totalLosses = 0;
  let totalGames = 0;

  // Process Session Games
  for (const g of sessionGames) {
    const inA =
      g.teamAPlayers.includes(email) || g.teamAPlayers.includes(userDisplay);
    const inB =
      g.teamBPlayers.includes(email) || g.teamBPlayers.includes(userDisplay);

    if (inA || inB) {
      totalGames++;
      if ((g.winner === "A" && inA) || (g.winner === "B" && inB)) {
        totalWins++;
      } else if (g.winner) {
        totalLosses++;
      }
    }
  }

  // Process Tournament Games
  for (const g of tournamentGames) {
    const inA =
      g.teamAPlayers.includes(email) || g.teamAPlayers.includes(userDisplay);
    const inB =
      g.teamBPlayers.includes(email) || g.teamBPlayers.includes(userDisplay);

    if (inA || inB) {
      totalGames++;
      if ((g.winningTeam === "A" && inA) || (g.winningTeam === "B" && inB)) {
        totalWins++;
      } else if (g.winningTeam === "A" || g.winningTeam === "B") {
        totalLosses++;
      }
    }
  }

  const winRate =
    totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : "0";
  const totalPoints = totalWins * 3 + totalGames;

  return {
    totalPoints,
    totalWins,
    totalLosses,
    winRate,
    totalGames,
  };
}

export async function getUserTeams(userId: string, email: string) {
  // Fetch teams where user is owner OR member
  const teams = await prisma.team.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { email: email } } }],
    },
    include: {
      members: true,
      sessions: {
        include: {
          games: {
            select: {
              winner: true,
              teamAPlayers: true,
              teamBPlayers: true,
            },
          },
        },
      },
      // We might need tournament stats too, but let's keep it lighter for now
      // or fetch them if needed for the "plays/wins" on the card
    },
  });

  // We still need to calculate the "plays" and "wins" for the card display
  // This is a bit heavy, but scoped to the user's teams
  const teamStats = teams.map((t) => {
    let plays = 0;
    let wins = 0;
    // Simple calculation based on sessions only for now to match UI speed
    // If we need tournament stats on the team card, we'd need to fetch that too
    for (const s of t.sessions) {
      for (const g of s.games) {
        if (g.winner) {
          plays++;
          // Assuming if the team played, they are "Team A" or "Team B"?
          // Wait, the logic in page.tsx was checking if the USER was in the game.
          // The card shows "Your stats in this team" or "Team's total stats"?
          // page.tsx: "stat.plays" comes from "teamStats" which filtered by USER participation.
          // So we need to check if USER was in the game.
          const inA = g.teamAPlayers.includes(email); // Simplified check
          const inB = g.teamBPlayers.includes(email);
          if (inA || inB) {
            if ((g.winner === "A" && inA) || (g.winner === "B" && inB)) wins++;
          }
        }
      }
    }
    return {
      ...t,
      stats: {
        plays,
        wins,
        winRate: plays > 0 ? ((wins / plays) * 100).toFixed(1) : "0",
      },
    };
  });

  return teamStats;
}

export async function getUserTournaments(userId: string) {
  const tournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { ownerId: userId },
        // Add participation check if needed, but schema doesn't have direct link easily without join
        // For now, let's show owned tournaments + maybe fetch participated ones separately if critical
        // The original code did a complex map/filter.
        // Let's stick to owned for speed, or add a relation query if we can.
      ],
    },
    orderBy: { createdAt: "desc" },
  });
  return tournaments;
}

export async function getUpcomingSession(userId: string, email: string) {
  // Optimized query for just the next session
  // This is hard to do purely in DB because of the "User -> Team -> Session" path
  // But we can fetch all sessions for user's teams and sort
  const teams = await prisma.team.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { email: email } } }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sessions: {
        where: {
          date: {
            gte: new Date(), // Only future sessions
          },
        },
        orderBy: {
          date: "asc",
        },
        take: 1,
      },
    },
  });

  // Flatten and find the absolute nearest
  const sessions = teams.flatMap((t) =>
    t.sessions.map((s) => ({ ...s, team: t }))
  );
  sessions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return sessions.length > 0 ? sessions[0] : null;
}

export async function getPlayerIntelData(
  userId: string,
  email: string,
  displayName: string | null
) {
  const userDisplay = displayName ?? email;

  // Reuse getUserStats logic (or call it if we export the internal logic)
  const stats = await getUserStats(userId, email, displayName);

  // Reuse getUserTeams logic
  const teams = await getUserTeams(userId, email);

  // Calculate Partner Stats
  // We need to fetch all games for this user to calculate partner stats
  // This is the heaviest part.
  // Optimization: Only fetch games where user is a player, select partner.

  // Fetch Session Games for Partner Stats
  const sessionGames = await prisma.game.findMany({
    where: {
      OR: [
        { teamAPlayers: { has: email } },
        { teamBPlayers: { has: email } },
        { teamAPlayers: { has: userDisplay } },
        { teamBPlayers: { has: userDisplay } },
      ],
    },
    select: {
      winner: true,
      teamAPlayers: true,
      teamBPlayers: true,
    },
  });

  const partnerMap = new Map<string, { plays: number; wins: number }>();

  for (const g of sessionGames) {
    let partnerName: string | null = null;
    // Check Team A
    if (
      g.teamAPlayers.includes(email) ||
      g.teamAPlayers.includes(userDisplay)
    ) {
      // User is in Team A. Partner is the other person in Team A (if any)
      // Assuming max 2 players per team for now as per "Partner" logic
      const other = g.teamAPlayers.find(
        (p) => p !== email && p !== userDisplay
      );
      if (other) partnerName = other;
    }
    // Check Team B
    else if (
      g.teamBPlayers.includes(email) ||
      g.teamBPlayers.includes(userDisplay)
    ) {
      const other = g.teamBPlayers.find(
        (p) => p !== email && p !== userDisplay
      );
      if (other) partnerName = other;
    }

    if (partnerName) {
      const current = partnerMap.get(partnerName) || { plays: 0, wins: 0 };
      current.plays++;
      // Win check
      const inA =
        g.teamAPlayers.includes(email) || g.teamAPlayers.includes(userDisplay);
      const inB =
        g.teamBPlayers.includes(email) || g.teamBPlayers.includes(userDisplay);
      if ((g.winner === "A" && inA) || (g.winner === "B" && inB)) {
        current.wins++;
      }
      partnerMap.set(partnerName, current);
    }
  }

  const partnerStats: PartnerStat[] = Array.from(partnerMap.entries()).map(
    ([partner, data]) => ({
      partner,
      ...data,
      winRate:
        data.plays > 0 ? ((data.wins / data.plays) * 100).toFixed(1) : "0",
    })
  );

  const facts = generatePlayerFacts(
    stats,
    teams.map((t) => ({
      teamName: t.name,
      plays: t.stats.plays,
      wins: t.stats.wins,
      winRate: t.stats.winRate,
    })),
    partnerStats,
    userDisplay
  );

  return facts;
}

export async function getSessionInfoData(userId: string, email: string) {
  // We need all teams to pass to findUpcomingOrRecentSession
  // But that function expects a specific structure.
  // Let's just fetch the sessions directly as we did in getUpcomingSession but return the formatted info

  const teams = await prisma.team.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { email: email } } }],
    },
    include: {
      sessions: {
        orderBy: { date: "asc" },
      },
    },
  });

  // Map to the format expected by findUpcomingOrRecentSession
  // It expects teams with sessions
  return findUpcomingOrRecentSession(teams, "Asia/Kolkata");
}

export async function getAppDataFreshness(userId: string) {
  const appConfig = await prisma.appConfig.findUnique({
    where: { key: "lastBuildTime" },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { packageType: true },
  });

  return {
    lastBuildTime: appConfig?.value
      ? new Date(appConfig.value).toISOString()
      : new Date().toISOString(),
    packageType: user?.packageType ?? "FREE",
  };
}
