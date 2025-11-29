import { prisma } from "@/lib/db";

interface TeammateStats {
  userId: string;
  name: string;
  image: string | null;
  gamesPlayed: number;
  wins: number;
  winRate: number;
}

export async function getBestTeammates(
  userId: string,
  limit: number = 3
): Promise<TeammateStats[]> {
  // Find all games where this user participated
  const userGames = await prisma.tournamentGame.findMany({
    where: {
      OR: [
        { teamA: { players: { some: { userId } } } },
        { teamB: { players: { some: { userId } } } },
      ],
      status: "COMPLETED",
    },
    include: {
      teamA: { include: { players: { include: { user: true } } } },
      teamB: { include: { players: { include: { user: true } } } },
    },
  });

  // Track stats for each teammate
  const teammateMap = new Map<
    string,
    { name: string; image: string | null; games: number; wins: number }
  >();

  for (const game of userGames) {
    // Determine which team the user was on
    const userInTeamA = game.teamA.players.some((p) => p.userId === userId);
    const userTeam = userInTeamA ? game.teamA : game.teamB;
    const won =
      (userInTeamA && game.winningTeam === "A") ||
      (!userInTeamA && game.winningTeam === "B");

    // Find teammates (excluding the user)
    const teammates = userTeam.players.filter(
      (p) => p.userId !== userId && p.user
    );

    for (const teammate of teammates) {
      if (!teammate.user) continue;

      const existing = teammateMap.get(teammate.userId!);
      if (existing) {
        existing.games++;
        if (won) existing.wins++;
      } else {
        teammateMap.set(teammate.userId!, {
          name: teammate.user.name || "Unknown",
          image: teammate.user.image,
          games: 1,
          wins: won ? 1 : 0,
        });
      }
    }
  }

  // Convert to array and calculate win rates
  const teammates: TeammateStats[] = Array.from(teammateMap.entries())
    .map(([id, stats]) => ({
      userId: id,
      name: stats.name,
      image: stats.image,
      gamesPlayed: stats.games,
      wins: stats.wins,
      winRate:
        stats.games > 0
          ? Math.round((stats.wins / stats.games) * 1000) / 10
          : 0,
    }))
    .filter((t) => t.gamesPlayed >= 2) // Only show teammates with at least 2 games
    .sort((a, b) => {
      // Sort by win rate first, then by games played
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.gamesPlayed - a.gamesPlayed;
    });

  return teammates.slice(0, limit);
}
