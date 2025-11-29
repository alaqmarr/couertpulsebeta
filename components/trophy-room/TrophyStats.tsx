import { getOrCreateUser } from "@/lib/clerk";
import { analyticsDb } from "@/lib/analytics-db";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";

export async function TrophyStats() {
    const user = await getOrCreateUser();
    if (!user) redirect("/login");

    const userAchievements = await analyticsDb.userAchievement.findMany({
        where: { userId: user.id },
        include: { achievement: true },
    });

    const totalUnlocked = userAchievements.length;

    const tierCounts = {
        DIAMOND: userAchievements.filter((ua) => ua.achievement.tier === "DIAMOND").length,
        PLATINUM: userAchievements.filter((ua) => ua.achievement.tier === "PLATINUM").length,
        GOLD: userAchievements.filter((ua) => ua.achievement.tier === "GOLD").length,
        SILVER: userAchievements.filter((ua) => ua.achievement.tier === "SILVER").length,
        BRONZE: userAchievements.filter((ua) => ua.achievement.tier === "BRONZE").length,
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="glass-card text-center">
                <CardContent className="pt-6">
                    <div className="text-3xl font-bold">{totalUnlocked}</div>
                    <div className="text-sm text-muted-foreground">Total Unlocked</div>
                </CardContent>
            </Card>

            <Card className="glass-card text-center">
                <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-purple-500">{tierCounts.DIAMOND}</div>
                    <div className="text-sm text-muted-foreground">Diamond</div>
                </CardContent>
            </Card>

            <Card className="glass-card text-center">
                <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-cyan-400">{tierCounts.PLATINUM}</div>
                    <div className="text-sm text-muted-foreground">Platinum</div>
                </CardContent>
            </Card>

            <Card className="glass-card text-center">
                <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-yellow-500">{tierCounts.GOLD}</div>
                    <div className="text-sm text-muted-foreground">Gold</div>
                </CardContent>
            </Card>

            <Card className="glass-card text-center">
                <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-gray-400">{tierCounts.SILVER}</div>
                    <div className="text-sm text-muted-foreground">Silver</div>
                </CardContent>
            </Card>
        </div>
    );
}
