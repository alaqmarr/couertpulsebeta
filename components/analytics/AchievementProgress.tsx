"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type AchievementInsights = {
    unlocked: Array<{
        id: string;
        unlockedAt: Date;
        achievement: {
            name: string;
            description: string;
            icon: string;
            tier: string;
        };
    }>;
    totalUnlocked: number;
    totalAvailable: number;
    progress: number;
    nextMilestones: {
        gamesPlayed: number;
        wins: number;
        tournaments: number;
        teams: number;
    };
};

const tierColors: Record<string, string> = {
    BRONZE: "text-orange-600",
    SILVER: "text-gray-400",
    GOLD: "text-yellow-500",
    PLATINUM: "text-cyan-400",
    DIAMOND: "text-purple-500",
};

export function AchievementProgress({ insights }: { insights: AchievementInsights }) {
    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Achievement Progress
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                        {insights.totalUnlocked}/{insights.totalAvailable}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Overall Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Completion</span>
                        <span className="text-sm text-muted-foreground">{insights.progress}%</span>
                    </div>
                    <Progress value={insights.progress} className="h-2" />
                </div>

                {/* Recent Unlocks */}
                {insights.unlocked.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Recently Unlocked</h4>
                        <div className="space-y-2">
                            {insights.unlocked.slice(0, 3).map((ua) => (
                                <div
                                    key={ua.id}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20"
                                >
                                    <Trophy
                                        className={`w-4 h-4 ${tierColors[ua.achievement.tier] || "text-gray-500"}`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{ua.achievement.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(ua.unlockedAt, { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Next Milestones */}
                <div>
                    <h4 className="text-sm font-semibold mb-2">Your Stats</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-secondary/20 text-center">
                            <p className="text-2xl font-bold">{insights.nextMilestones.gamesPlayed}</p>
                            <p className="text-xs text-muted-foreground">Games Played</p>
                        </div>
                        <div className="p-2 rounded-lg bg-secondary/20 text-center">
                            <p className="text-2xl font-bold">{insights.nextMilestones.wins}</p>
                            <p className="text-xs text-muted-foreground">Wins</p>
                        </div>
                        <div className="p-2 rounded-lg bg-secondary/20 text-center">
                            <p className="text-2xl font-bold">{insights.nextMilestones.tournaments}</p>
                            <p className="text-xs text-muted-foreground">Tournaments</p>
                        </div>
                        <div className="p-2 rounded-lg bg-secondary/20 text-center">
                            <p className="text-2xl font-bold">{insights.nextMilestones.teams}</p>
                            <p className="text-xs text-muted-foreground">Teams</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
