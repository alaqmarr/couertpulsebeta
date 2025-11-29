import { getOrCreateUser } from "@/lib/clerk";
import { analyticsDb } from "@/lib/analytics-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { Trophy } from "lucide-react";
import { redirect } from "next/navigation";

export async function RecentAchievements() {
    const user = await getOrCreateUser();
    if (!user) redirect("/login");

    const userAchievements = await analyticsDb.userAchievement.findMany({
        where: { userId: user.id },
        include: { achievement: true },
        orderBy: { unlockedAt: "desc" },
        take: 12
    });

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle>Recent Unlocks</CardTitle>
            </CardHeader>
            <CardContent>
                {userAchievements.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                        <Trophy className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
                        <p className="text-muted-foreground">No achievements unlocked yet</p>
                        <p className="text-sm text-muted-foreground">
                            Keep playing to unlock your first achievement!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {userAchievements.map((ua) => (
                            <div key={ua.id} className="flex flex-col items-center gap-2">
                                <AchievementBadge
                                    name={ua.achievement.name}
                                    description={ua.achievement.description}
                                    tier={ua.achievement.tier as any}
                                    icon={ua.achievement.icon}
                                    unlocked={true}
                                    size="lg"
                                />
                                <p className="text-xs text-center text-muted-foreground">
                                    {new Date(ua.unlockedAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
