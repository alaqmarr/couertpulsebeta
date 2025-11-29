import { prisma } from "@/lib/db";
import { analyticsDb } from "@/lib/analytics-db";
import { achievementDefinitions } from "./definitions";

/**
 * Check if user meets criteria for an achievement
 * Reads from PRIMARY DB (transactional data)
 */
async function checkAchievementCriteria(
  userId: string,
  criteria: any
): Promise<boolean> {
  const { type, value } = criteria;

  switch (type) {
    case "games_played": {
      const count = await prisma.tournamentGame.count({
        where: {
          OR: [
            { teamA: { players: { some: { userId } } } },
            { teamB: { players: { some: { userId } } } },
          ],
          status: "COMPLETED",
        },
      });
      return count >= value;
    }

    case "wins": {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { wins: true },
      });
      return (user?.wins || 0) >= value;
    }

    case "tournaments_joined": {
      const count = await prisma.tournamentPlayer.count({
        where: { userId },
      });
      return count >= value;
    }

    case "teams_joined": {
      const count = await prisma.teamMember.count({
        where: { userId },
      });
      return count >= value;
    }

    case "points_scored": {
      const count = await prisma.tournamentPoint.count({
        where: { scorerId: userId },
      });
      return count >= value;
    }

    default:
      return false;
  }
}

/**
 * Unlock a specific achievement for a user
 * Writes to ANALYTICS DB (achievement tracking)
 */
export async function unlockAchievement(
  userId: string,
  achievementKey: string
) {
  // Check achievement definition from analytics DB
  const achievement = await analyticsDb.achievement.findUnique({
    where: { key: achievementKey },
  });

  if (!achievement) {
    console.error(`Achievement ${achievementKey} not found`);
    return null;
  }

  // Check if already unlocked in analytics DB
  const existing = await analyticsDb.userAchievement.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id,
      },
    },
  });

  if (existing) return existing;

  // Unlock achievement in analytics DB
  const userAchievement = await analyticsDb.userAchievement.create({
    data: {
      userId,
      achievementId: achievement.id,
      progress: 100,
    },
    include: {
      achievement: true,
    },
  });

  // Log activity to analytics DB
  const { logActivity } = await import("@/lib/activity-logger");
  await logActivity(
    userId,
    "GAME_WON",
    achievement.id,
    `Unlocked: ${achievement.name}`
  );

  return userAchievement;
}

/**
 * Check and unlock all eligible achievements for a user
 * Reads from PRIMARY, writes to ANALYTICS
 */
export async function checkAndUnlockAchievements(userId: string) {
  const unlockedAchievements = [];

  for (const def of achievementDefinitions) {
    // Get achievement from analytics DB
    const achievement = await analyticsDb.achievement.findUnique({
      where: { key: def.key },
    });

    if (!achievement) continue;

    // Check if already unlocked
    const existing = await analyticsDb.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing) continue;

    // Check criteria against PRIMARY DB (gameplay data)
    const meetsCriteria = await checkAchievementCriteria(userId, def.criteria);

    if (meetsCriteria) {
      const unlocked = await unlockAchievement(userId, def.key);
      if (unlocked) {
        unlockedAchievements.push(unlocked);
      }
    }
  }

  return unlockedAchievements;
}

/**
 * Seed achievements into ANALYTICS database
 */
export async function seedAchievements() {
  for (const def of achievementDefinitions) {
    await analyticsDb.achievement.upsert({
      where: { key: def.key },
      update: {
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        tier: def.tier,
        criteria: def.criteria as any,
      },
      create: {
        key: def.key,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        tier: def.tier,
        criteria: def.criteria as any,
      },
    });
  }

  console.log(
    `Seeded ${achievementDefinitions.length} achievements to analytics DB`
  );
}
