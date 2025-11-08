"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { CircularProgress } from "@/app/team/[slug]/stats/circular-progress";

interface PairStat {
    id: string;
    playerA: string;
    playerB: string;
    plays: number;
    wins: number;
}

export default function TopPairs({ pairs }: { pairs: PairStat[] }) {
    if (!pairs || pairs.length === 0)
        return (
            <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
                <Trophy size={22} className="text-primary" />
                <p className="text-sm text-muted-foreground text-center">
                    No pair statistics yet.
                </p>
            </div>
        );

    // Sort and limit
    const topPairs = [...pairs]
        .sort((a, b) => b.wins / b.plays - a.wins / a.plays)
        .slice(0, 6);

    const getColor = (rate: number) => {
        if (rate < 30) return "text-red-500";
        if (rate < 60) return "text-yellow-500";
        return "text-green-500";
    };

    return (
        <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy size={18} />
                    Top Performing Pairs
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {topPairs.map((pair, index) => {
                        const winRate =
                            pair.plays > 0 ? (pair.wins / pair.plays) * 100 : 0;
                        return (
                            <div
                                key={pair.id}
                                className={cn(
                                    "relative flex flex-col items-center justify-center rounded-lg border bg-card/60 p-4 hover:-translate-y-[2px] transition-all duration-300 hover:shadow-lg",
                                    index === 0 ? "border-primary/40" : "border-border"
                                )}
                            >
                                {index === 0 && (
                                    <span className="absolute -top-2 right-3 text-xs font-semibold text-primary">
                                        #1
                                    </span>
                                )}

                                <CircularProgress
                                    value={winRate}
                                    color={getColor(winRate)}
                                    size={80}
                                />

                                <p className="mt-3 text-sm font-medium text-center">
                                    {pair.playerA} & {pair.playerB}
                                </p>

                                <p className="text-xs text-muted-foreground mt-1">
                                    {pair.wins} Wins / {pair.plays} Matches
                                </p>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
