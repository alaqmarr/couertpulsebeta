import { prisma } from "@/lib/db";

export async function getPlayerOverallStats(userId: string) {
  // Get all tournament games where user participated
  const tournamentGames = await prisma.tournamentGame.findMany({
    where: {
      OR: [
        { teamA: { players: { some: { userId } } } },
        { teamB: { players: { some: { userId } } } },
      ],
      status: "COMPLETED",
    },
    include: {
      teamA: { include: { players: true } },
      teamB: { include: { players: true } },
    },
  });

  // Get all team session games
  const sessionGames = await prisma.game.findMany({
    where: {
      session: {
        team: {
          members: { some: { userId } },
        },
      },
      winner: { not: null },
    },
  });

  const totalTournamentGames = tournamentGames.length;
  const totalSessionGames = sessionGames.length;
  const totalGames = totalTournamentGames + totalSessionGames;

  // Calculate wins for tournament games
  let tournamentWins = 0;
  for (const game of tournamentGames) {
    const isInTeamA = game.teamA.players.some((p) => p.userId === userId);
    const isInTeamB = game.teamB.players.some((p) => p.userId === userId);

    if (
      (isInTeamA && game.winningTeam === "A") ||
      (isInTeamB && game.winningTeam === "B")
    ) {
      tournamentWins++;
    }
  }

  // Calculate wins for session games (simplified - assumes user's team won)
  const sessionWins =
    sessionGames.filter((g) => g.winner === "A" || g.winner === "B").length / 2; // rough estimate

  const totalWins = tournamentWins + sessionWins;
  const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

  // Get points scored
  const pointsScored = await prisma.tournamentPoint.count({
    where: { scorerId: userId },
  });

  return {
    totalGames,
    totalWins,
    totalLosses: totalGames - totalWins,
    winRate: Math.round(winRate * 10) / 10,
    pointsScored,
    tournamentGames: totalTournamentGames,
    sessionGames: totalSessionGames,
  };
}

export async function getPlayerTournamentStats(
  userId: string,
  tournamentId: string
) {
  const player = await prisma.tournamentPlayer.findFirst({
    where: { userId, tournamentId },
    include: {
      scoredPoints: true,
      team: true,
    },
  });

  if (!player) return null;

  const games = await prisma.tournamentGame.findMany({
    where: {
      tournamentId,
      OR: [
        { teamA: { players: { some: { userId } } } },
        { teamB: { players: { some: { userId } } } },
      ],
      status: "COMPLETED",
    },
    include: {
      teamA: true,
      teamB: true,
    },
  });

  let wins = 0;
  for (const game of games) {
    const isInTeamA = game.teamA.id === player.teamId;
    const isInTeamB = game.teamB.id === player.teamId;

    if (
      (isInTeamA && game.winningTeam === "A") ||
      (isInTeamB && game.winningTeam === "B")
    ) {
      wins++;
    }
  }

  return {
    matchesPlayed: games.length,
    wins,
    losses: games.length - wins,
    winRate:
      games.length > 0 ? Math.round((wins / games.length) * 1000) / 10 : 0,
    pointsScored: player.scoredPoints.length,
    teamName: player.team?.name || "Unsold",
    soldPrice: player.soldPrice,
  };
}

export async function getPlayerMatchHistory(
  userId: string,
  limit: number = 10
) {
  const games = await prisma.tournamentGame.findMany({
    where: {
      OR: [
        { teamA: { players: { some: { userId } } } },
        { teamB: { players: { some: { userId } } } },
      ],
      status: "COMPLETED",
    },
    include: {
      tournament: { select: { name: true, slug: true } },
      teamA: { select: { name: true, logoUrl: true } },
      teamB: { select: { name: true, logoUrl: true } },
    },
    orderBy: { completedAt: "desc" },
    take: limit,
  });

  return games.map((game) => ({
    id: game.id,
    tournamentName: game.tournament.name,
    tournamentSlug: game.tournament.slug,
    teamA: game.teamA.name,
    teamB: game.teamB.name,
    scoreA: game.teamAScore,
    scoreB: game.teamBScore,
    winner: game.winningTeam,
    completedAt: game.completedAt,
  }));
}

export async function calculateWinRate(userId: string): Promise<number> {
  const stats = await getPlayerOverallStats(userId);
  return stats.winRate;
}
