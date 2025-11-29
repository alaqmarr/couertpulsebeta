import { getOrCreateUser } from "@/lib/clerk";
import { getUserAchievementInsights } from "@/lib/analytics/insights";
import { analyticsDb } from "@/lib/analytics-db";
import { AchievementGrid } from "@/components/achievements/AchievementGrid";
import { redirect } from "next/navigation";

export default async function AchievementsPage() {
    const user = await getOrCreateUser();
    if (!user) redirect("/login");

    // Get all achievements
    const allAchievements = await analyticsDb.achievement.findMany({
        orderBy: [{ category: "asc" }, { tier: "asc" }],
    });

    // Get user's unlocked achievements
    const userAchievements = await analyticsDb.userAchievement.findMany({
        where: { userId: user.id },
        include: { achievement: true },
    });

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    // Merge data
    const achievementsWithStatus = allAchievements.map((achievement) => {
        const userAchievement = userAchievements.find(
            (ua) => ua.achievementId === achievement.id
        );

        return {
            ...achievement,
            unlocked: unlockedIds.has(achievement.id),
            unlockedAt: userAchievement?.unlockedAt,
        };
    });

    // Get insights
    const insights = await getUserAchievementInsights(user.id);

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold">Your Achievements</h1>
                <p className="text-muted-foreground">
                    {insights.progress}% Complete • {insights.totalUnlocked} of {insights.totalAvailable}{" "}
                    Unlocked
                </p>
            </div>

            <AchievementGrid achievements={achievementsWithStatus} />
        </div>
    );
}
