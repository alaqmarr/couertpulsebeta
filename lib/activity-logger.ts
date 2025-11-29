"use server";

import { analyticsDb } from "@/lib/analytics-db";

/**
 * Log activity to Analytics DB
 * Activities are write-heavy and read for analytics, perfect for secondary DB
 */
export async function logActivity(
  userId: string,
  type: string,
  refId?: string,
  message?: string
) {
  await analyticsDb.activity.create({
    data: {
      userId,
      type: type as any,
      refId,
      message,
    },
  });
}

/**
 * Get recent activity from Analytics DB
 */
export async function getRecentActivity(userId: string, limit: number = 20) {
  return await analyticsDb.activity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get team activity from Analytics DB
 */
export async function getTeamActivity(teamId: string, limit: number = 20) {
  // Still need to get team info from primary DB
  const { prisma } = await import("@/lib/db");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: { select: { userId: true } } },
  });

  if (!team) return [];

  const userIds = team.members
    .filter((m) => m.userId !== null)
    .map((m) => m.userId!);

  // Get activities from analytics DB
  return await analyticsDb.activity.findMany({
    where: {
      userId: { in: userIds },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get tournament activity from Analytics DB
 */
export async function getTournamentActivity(
  tournamentId: string,
  limit: number = 20
) {
  // Get tournament structure from primary DB
  const { prisma } = await import("@/lib/db");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: { select: { userId: true } } },
  });

  if (!tournament) return [];

  const userIds = tournament.players
    .filter((p) => p.userId !== null)
    .map((p) => p.userId!);

  // Get activities from analytics DB
  return await analyticsDb.activity.findMany({
    where: {
      userId: { in: userIds },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
