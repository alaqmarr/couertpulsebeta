// lib/leaderboard.ts
import { prisma } from "@/lib/db";

/**
 * Computes session-level leaderboard: per-player games, wins, losses, win rate.
 * Returns an array sorted by win rate descending.
 */
export async function getSessionLeaderboard(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      team: {
        include: {
          members: {
            include: { user: true },
          },
        },
      },
      games: true,
    },
  });

  if (!session) return [];

  const playerStats = new Map<
    string,
    { plays: number; wins: number; name: string }
  >();

  for (const game of session.games) {
    const all = [...game.teamAPlayers, ...game.teamBPlayers];
    for (const email of all) {
      const stat = playerStats.get(email) ?? { plays: 0, wins: 0, name: email };
      stat.plays++;
      if (
        (game.winner === "A" && game.teamAPlayers.includes(email)) ||
        (game.winner === "B" && game.teamBPlayers.includes(email))
      )
        stat.wins++;
      playerStats.set(email, stat);
    }
  }

  const leaderboard = Array.from(playerStats.entries()).map(([email, s]) => {
    const member = session.team.members.find((m) => m.email === email);
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

  leaderboard.sort((a, b) => b.winRate - a.winRate);
  return leaderboard;
}

export async function getTeamLeaderboard(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { include: { user: true } },
      sessions: { include: { games: true } },
    },
  });

  if (!team) return [];

  const stats = new Map<string, { plays: number; wins: number }>();

  for (const session of team.sessions) {
    for (const g of session.games) {
      const allPlayers = [...g.teamAPlayers, ...g.teamBPlayers];
      for (const p of allPlayers) {
        const entry = stats.get(p) || { plays: 0, wins: 0 };
        entry.plays++;
        if (
          (g.winner === "A" && g.teamAPlayers.includes(p)) ||
          (g.winner === "B" && g.teamBPlayers.includes(p))
        )
          entry.wins++;
        stats.set(p, entry);
      }
    }
  }

  return Array.from(stats.entries()).map(([email, s]) => {
    const member = team.members.find((m) => m.email === email);
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
}
