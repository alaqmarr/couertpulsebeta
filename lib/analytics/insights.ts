import { analyticsDb } from "@/lib/analytics-db";
import { prisma } from "@/lib/db";

/**
 * Get user's achievement progress and insights
 * Analytics DB for achievements, Primary DB for gameplay stats
 */
export async function getUserAchievementInsights(userId: string) {
  // Get unlocked achievements from analytics DB
  const unlockedAchievements = await analyticsDb.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" },
  });

  // Get gameplay stats from primary DB
  const [gamesPlayed, wins, tournamentCount, teamCount] = await Promise.all([
    prisma.tournamentGame.count({
      where: {
        OR: [
          { teamA: { players: { some: { userId } } } },
          { teamB: { players: { some: { userId } } } },
        ],
        status: "COMPLETED",
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { wins: true },
    }),
    prisma.tournamentPlayer.count({ where: { userId } }),
    prisma.teamMember.count({ where: { userId } }),
  ]);

  // Get total available achievements
  const totalAchievements = await analyticsDb.achievement.count();

  return {
    unlocked: unlockedAchievements,
    totalUnlocked: unlockedAchievements.length,
    totalAvailable: totalAchievements,
    progress:
      totalAchievements > 0
        ? Math.round((unlockedAchievements.length / totalAchievements) * 100)
        : 0,
    nextMilestones: {
      gamesPlayed,
      wins: wins?.wins || 0,
      tournaments: tournamentCount,
      teams: teamCount,
    },
  };
}

/**
 * Get personalized recommendations based on analytics
 */
export async function getPersonalizedRecommendations(userId: string) {
  // Get recent activity from analytics DB
  const recentActivities = await analyticsDb.activity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Get user stats from primary DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: { include: { team: true } },
      tournamentPlayers: { include: { tournament: true } },
    },
  });

  if (!user) return [];

  const recommendations = [];

  // Analyze activity patterns
  const activityTypes = recentActivities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recommendation: Join a team
  if (user.memberships.length === 0) {
    recommendations.push({
      type: "JOIN_TEAM",
      title: "Join Your First Team",
      description:
        "Team up with friends and unlock the Team Player achievement!",
      priority: "high",
      icon: "Users",
    });
  }

  // Recommendation: Join a tournament
  if (user.tournamentPlayers.length === 0) {
    recommendations.push({
      type: "JOIN_TOURNAMENT",
      title: "Enter a Tournament",
      description:
        "Compete in your first tournament and earn Tournament Debut badge!",
      priority: "high",
      icon: "Trophy",
    });
  }

  // Recommendation: Play more games
  const gamesPlayed = activityTypes["GAME_PLAYED"] || 0;
  if (gamesPlayed < 10) {
    recommendations.push({
      type: "PLAY_GAMES",
      title: "Practice Makes Perfect",
      description: `Play ${
        10 - gamesPlayed
      } more games to unlock Regular Player achievement!`,
      priority: "medium",
      icon: "Target",
    });
  }

  return recommendations;
}

/**
 * Get trending achievements - most recently unlocked across all users
 */
export async function getTrendingAchievements(limit: number = 5) {
  const trending = await analyticsDb.userAchievement.findMany({
    include: {
      achievement: true,
    },
    orderBy: { unlockedAt: "desc" },
    take: limit,
    distinct: ["achievementId"],
  });

  return trending.map((ua) => ({
    achievement: ua.achievement,
    recentUnlocks: ua.unlockedAt,
  }));
}

/**
 * Get user activity timeline for the past week
 */
export async function getUserActivityTimeline(
  userId: string,
  days: number = 7
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const activities = await analyticsDb.activity.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const timeline = activities.reduce((acc, activity) => {
    const date = activity.createdAt.toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, typeof activities>);

  return timeline;
}
