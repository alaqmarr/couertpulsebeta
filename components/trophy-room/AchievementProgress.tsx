import { getOrCreateUser } from "@/lib/clerk";
import { analyticsDb } from "@/lib/analytics-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export async function AchievementProgress() {
    const user = await getOrCreateUser();
    if (!user) redirect("/login");

    const totalUnlocked = await analyticsDb.userAchievement.count({
        where: { userId: user.id }
    });

    const totalAchievements = await analyticsDb.achievement.count();

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle>Completion Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span className="font-medium">
                            {totalUnlocked}/{totalAchievements} ({totalAchievements > 0 ? Math.round((totalUnlocked / totalAchievements) * 100) : 0}%)
                        </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-primary to-primary/60 h-3 rounded-full transition-all"
                            style={{ width: `${totalAchievements > 0 ? (totalUnlocked / totalAchievements) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
