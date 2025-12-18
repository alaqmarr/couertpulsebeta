"use server";

import { prisma } from "@/lib/db";

export async function getSessionLeaderboard(sessionId: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        games: true,
        participants: {
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    // Map email to display name
    const playerMap = new Map<string, string>();
    session.participants.forEach((p) => {
      const name =
        p.member.displayName ||
        p.member.user?.name ||
        p.member.email.split("@")[0];
      playerMap.set(p.member.email, name);
    });

    // Calculate stats
    const stats = new Map<
      string,
      {
        plays: number;
        wins: number;
        losses: number;
        pointsWon: number;
        pointsLost: number;
      }
    >();

    session.games.forEach((game) => {
      if (!game.winner) return; // Skip unfinished games

      const players = [...game.teamAPlayers, ...game.teamBPlayers];
      const winners =
        game.winner === "A"
          ? game.teamAPlayers
          : game.winner === "B"
          ? game.teamBPlayers
          : [];

      players.forEach((email) => {
        if (!stats.has(email)) {
          stats.set(email, {
            plays: 0,
            wins: 0,
            losses: 0,
            pointsWon: 0,
            pointsLost: 0,
          });
        }
        const s = stats.get(email)!;
        s.plays += 1;

        // Points Calculation
        const isTeamA = game.teamAPlayers.includes(email);
        const myScore = isTeamA ? game.teamAScore || 0 : game.teamBScore || 0;
        const opponentScore = isTeamA
          ? game.teamBScore || 0
          : game.teamAScore || 0;

        s.pointsWon += myScore;
        s.pointsLost += opponentScore;

        if (game.winner !== "DRAW") {
          if (winners.includes(email)) {
            s.wins += 1;
          } else {
            s.losses += 1;
          }
        }
      });
    });

    // Format for response
    const leaderboard = Array.from(stats.entries()).map(([email, s]) => {
      const winRate = s.plays > 0 ? (s.wins / s.plays) * 100 : 0;
      const pointsDiff = s.pointsWon - s.pointsLost;
      return {
        id: email, // Using email as ID for the table key
        displayName: playerMap.get(email) || email.split("@")[0],
        plays: s.plays,
        wins: s.wins,
        losses: s.losses,
        winRate,
        pointsDiff,
      };
    });

    // Sort by Win Rate (desc), then Wins (desc), then Points Diff (desc)
    leaderboard.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.pointsDiff - a.pointsDiff;
    });

    return leaderboard;
  } catch (error) {
    console.error("Error fetching session leaderboard:", error);
    throw new Error("Failed to fetch session leaderboard");
  }
}

export async function getTeamLeaderboard(teamId: string) {
  try {
    const sessions = await prisma.session.findMany({
      where: { teamId },
      include: { games: true },
    });

    const tally = new Map<
      string,
      {
        plays: number;
        wins: number;
        pointsWon: number;
        pointsLost: number;
      }
    >();

    for (const session of sessions) {
      for (const g of session.games) {
        if (!g.winner) continue; // Skip unfinished games for stats

        const all = [...g.teamAPlayers, ...g.teamBPlayers];
        for (const p of all) {
          const rec = tally.get(p) || {
            plays: 0,
            wins: 0,
            pointsWon: 0,
            pointsLost: 0,
          };
          rec.plays += 1;

          // Win calculation
          if (
            (g.winner === "A" && g.teamAPlayers.includes(p)) ||
            (g.winner === "B" && g.teamBPlayers.includes(p))
          ) {
            rec.wins += 1;
          }

          // Points calculation
          const isTeamA = g.teamAPlayers.includes(p);
          const myScore = isTeamA ? g.teamAScore || 0 : g.teamBScore || 0;
          const opponentScore = isTeamA ? g.teamBScore || 0 : g.teamAScore || 0;

          rec.pointsWon += myScore;
          rec.pointsLost += opponentScore;

          tally.set(p, rec);
        }
      }
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: { user: true },
    });

    const data = Array.from(tally.entries()).map(([email, val]) => {
      const member = members.find((m) => m.email === email);
      const name =
        member?.displayName || member?.user?.name || email.split("@")[0];
      const losses = val.plays - val.wins;
      const winRate = val.plays > 0 ? (val.wins / val.plays) * 100 : 0;
      const pointsDiff = val.pointsWon - val.pointsLost;
      return {
        id: member?.id ?? email,
        name,
        ...val,
        losses,
        winRate,
        pointsDiff,
      };
    });

    // Sort: Win Rate (desc) -> Wins (desc) -> Points Diff (desc) -> Name (asc)
    const sortedData = data.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
      return a.name.localeCompare(b.name);
    });

    return sortedData;
  } catch (error) {
    console.error("Error fetching team leaderboard:", error);
    throw new Error("Failed to fetch team leaderboard");
  }
}
