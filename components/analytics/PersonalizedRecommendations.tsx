"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Users, TrendingUp } from "lucide-react";

type Recommendation = {
    type: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    icon: string;
};

const iconMap: Record<string, any> = {
    Users,
    Trophy,
    Target,
    TrendingUp,
};

export function PersonalizedRecommendations({
    recommendations,
}: {
    recommendations: Recommendation[];
}) {
    if (recommendations.length === 0) {
        return null;
    }

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recommended for You
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {recommendations.map((rec, idx) => {
                        const Icon = iconMap[rec.icon] || Target;
                        const priorityColor =
                            rec.priority === "high"
                                ? "bg-red-500"
                                : rec.priority === "medium"
                                    ? "bg-yellow-500"
                                    : "bg-blue-500";

                        return (
                            <div
                                key={idx}
                                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition cursor-pointer"
                            >
                                <div className={`p-2 rounded-full ${priorityColor}/20`}>
                                    <Icon className={`w-5 h-5 ${priorityColor.replace("bg-", "text-")}`} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold">{rec.title}</h4>
                                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                                </div>
                                {rec.priority === "high" && (
                                    <Badge variant="destructive" className="text-xs">
                                        High Priority
                                    </Badge>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
