import { prisma } from "@/lib/db";

/**
 * Calculate ELO rating change
 * @param playerRating Current player rating
 * @param opponentRating Opponent's rating
 * @param result 1 for win, 0.5 for draw, 0 for loss
 * @param kFactor K-factor (default 32)
 */
export function calculateEloChange(
  playerRating: number,
  opponentRating: number,
  result: number,
  kFactor: number = 32
): number {
  const expectedScore =
    1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const change = Math.round(kFactor * (result - expectedScore));
  return change;
}

/**
 * Update player's ELO rating after a game
 * @param userId Player's user ID
 * @param change ELO change amount
 * @param gameId Optional game ID for tracking
 */
export async function updatePlayerElo(
  userId: string,
  change: number,
  gameId?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { eloRating: true },
  });

  if (!user) return;

  const newRating = user.eloRating + change;

  await prisma.user.update({
    where: { id: userId },
    data: { eloRating: newRating },
  });

  // TODO: Create EloHistory record when schema is updated
  // await prisma.eloHistory.create({
  //   data: {
  //     userId,
  //     rating: newRating,
  //     change,
  //     gameId,
  //   },
  // });
}

/**
 * Calculate and update ELO for all players in a completed match
 */
export async function updateMatchElo(matchId: string) {
  const match = await prisma.tournamentGame.findUnique({
    where: { id: matchId },
    include: {
      teamA: { include: { players: { include: { user: true } } } },
      teamB: { include: { players: { include: { user: true } } } },
    },
  });

  if (!match || !match.winningTeam) return;

  const teamAPlayers = match.teamA.players.filter((p) => p.user);
  const teamBPlayers = match.teamB.players.filter((p) => p.user);

  // Calculate average team ratings
  const teamARating =
    teamAPlayers.reduce((sum, p) => sum + (p.user?.eloRating || 1500), 0) /
    teamAPlayers.length;
  const teamBRating =
    teamBPlayers.reduce((sum, p) => sum + (p.user?.eloRating || 1500), 0) /
    teamBPlayers.length;

  // Determine result for each team
  const teamAResult =
    match.winningTeam === "A" ? 1 : match.winningTeam === "DRAW" ? 0.5 : 0;
  const teamBResult =
    match.winningTeam === "B" ? 1 : match.winningTeam === "DRAW" ? 0.5 : 0;

  // Update ELO for Team A players
  for (const player of teamAPlayers) {
    if (!player.userId) continue;
    const change = calculateEloChange(
      player.user?.eloRating || 1500,
      teamBRating,
      teamAResult
    );
    await updatePlayerElo(player.userId, change, matchId);
  }

  // Update ELO for Team B players
  for (const player of teamBPlayers) {
    if (!player.userId) continue;
    const change = calculateEloChange(
      player.user?.eloRating || 1500,
      teamARating,
      teamBResult
    );
    await updatePlayerElo(player.userId, change, matchId);
  }
}
