// lib/leaderboard.ts
import { prisma } from "@/lib/db";

/**
 * Computes session-level leaderboard: per-player games, wins, losses, win rate.
 * Returns an array sorted by win rate descending.
 */
// lib/leaderboard.ts
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

  // aggregate stats
  const tally = new Map<
    string,
    { plays: number; wins: number; losses: number; pointsDiff: number }
  >();

  for (const g of session.games) {
    if (
      g.teamAScore === null ||
      g.teamBScore === null ||
      g.teamAScore === undefined ||
      g.teamBScore === undefined
    )
      continue;
    const diff = g.teamAScore - g.teamBScore;

    // update all participating players
    for (const email of g.teamAPlayers) {
      const stat = tally.get(email) || {
        plays: 0,
        wins: 0,
        losses: 0,
        pointsDiff: 0,
      };
      stat.plays++;
      if (g.winner === "A") stat.wins++;
      else if (g.winner === "B") stat.losses++;
      stat.pointsDiff += diff; // positive if team A wins by margin
      tally.set(email, stat);
    }
    for (const email of g.teamBPlayers) {
      const stat = tally.get(email) || {
        plays: 0,
        wins: 0,
        losses: 0,
        pointsDiff: 0,
      };
      stat.plays++;
      if (g.winner === "B") stat.wins++;
      else if (g.winner === "A") stat.losses++;
      stat.pointsDiff -= diff; // opposite sign for team B
      tally.set(email, stat);
    }
  }

  const members = session.team.members;
  const result = Array.from(tally.entries()).map(([email, s]) => {
    const member = members.find((m) => m.email === email);
    const name =
      member?.displayName || member?.user?.name || email.split("@")[0];
    const winRate = s.plays ? (s.wins / s.plays) * 100 : 0;
    return {
      id: member?.id ?? email,
      name,
      plays: s.plays,
      wins: s.wins,
      losses: s.losses,
      winRate,
      pointsDiff: s.pointsDiff,
    };
  });

  // sort by win rate, then points diff, then wins
  result.sort(
    (a, b) =>
      b.winRate - a.winRate ||
      b.pointsDiff - a.pointsDiff ||
      b.wins - a.wins ||
      a.name.localeCompare(b.name)
  );

  return result;
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
