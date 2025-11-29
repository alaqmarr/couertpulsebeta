"use client";

import { useState } from "react";
import { AchievementBadge } from "./AchievementBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Achievement = {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
    unlocked?: boolean;
    unlockedAt?: Date;
};

export function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
    const [filter, setFilter] = useState<string>("ALL");

    const categories = ["ALL", ...Array.from(new Set(achievements.map((a) => a.category)))];

    const filteredAchievements =
        filter === "ALL"
            ? achievements
            : achievements.filter((a) => a.category === filter);

    const unlockedCount = achievements.filter((a) => a.unlocked).length;

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Achievements</span>
                    <span className="text-sm font-normal text-muted-foreground">
                        {unlockedCount}/{achievements.length} Unlocked
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={filter} onValueChange={setFilter}>
                    <TabsList className="mb-6">
                        {categories.map((cat) => (
                            <TabsTrigger key={cat} value={cat} className="text-xs">
                                {cat.replace("_", " ")}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={filter}>
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                            {filteredAchievements.map((achievement) => (
                                <AchievementBadge
                                    key={achievement.id}
                                    name={achievement.name}
                                    description={achievement.description}
                                    tier={achievement.tier}
                                    icon={achievement.icon}
                                    unlocked={achievement.unlocked}
                                />
                            ))}
                        </div>

                        {filteredAchievements.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No achievements in this category
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
