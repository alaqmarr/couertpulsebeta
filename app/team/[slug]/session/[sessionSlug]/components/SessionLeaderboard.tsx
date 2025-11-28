"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";
import { Loader2, Trophy, Info, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionSync } from "@/hooks/useSessionSync";

interface LeaderboardEntry {
    id: string;
    displayName: string;
    plays: number;
    wins: number;
    losses: number;
    winRate: number;
    pointsDiff: number;
}

/**
 * Helper function to determine Tailwind color class based on win rate.
 */
function getWinRateColorClass(winRate: number): string {
    if (winRate < 20) return "text-red-500";
    if (winRate < 40) return "text-red-400";
    if (winRate < 60) return "text-yellow-400";
    if (winRate < 80) return "text-green-400";
    return "text-green-500";
}

export default function SessionLeaderboard({ sessionId }: { sessionId: string }) {
    const [isPending, startTransition] = useTransition();
    const [stats, setStats] = useState<LeaderboardEntry[]>([]);
    const { data: syncData } = useSessionSync(sessionId);

    useEffect(() => {
        if (!sessionId) return;

        startTransition(async () => {
            try {
                const res = await fetch(`/api/session/${sessionId}/leaderboard`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setStats(data);
            } catch {
                toast.error("Failed to load session leaderboard.");
            }
        });
    }, [sessionId, syncData]);

    if (isPending && stats.length === 0) {
        return (
            <div className="glass-panel rounded-xl p-1">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Trophy size={20} className="text-primary" />
                        <h2 className="text-xl font-bold tracking-tight">Session Leaderboard</h2>
                    </div>
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-xl p-1">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Trophy size={20} className="text-primary" />
                    <h2 className="text-xl font-bold tracking-tight">Session Leaderboard</h2>
                </div>

                {stats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-primary/10 rounded-xl bg-muted/5">
                        <Info size={24} className="text-primary/50" />
                        <p className="text-muted-foreground text-sm text-center">
                            No games played yet.
                            <br />
                            The leaderboard will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="w-full overflow-hidden rounded-lg border border-white/5 bg-background/20">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-white/5">
                                    <TableHead className="w-[50px] px-4 text-xs font-semibold uppercase tracking-wider">#</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Player</TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Plays</TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">W/L</TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Diff</TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Win Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.map((p, index) => (
                                    <TableRow key={p.id} className="hover:bg-white/5 border-white/5 transition-colors">
                                        <TableCell className="font-medium px-4">
                                            {index === 0 ? (
                                                <Medal className="w-5 h-5 text-yellow-500 drop-shadow-sm" />
                                            ) : (
                                                <span className="text-muted-foreground text-sm">{index + 1}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {p.displayName}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">{p.plays}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            <span className="text-green-500">{p.wins}</span>
                                            <span className="text-muted-foreground mx-1">/</span>
                                            <span className="text-red-500">{p.losses}</span>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${(p.pointsDiff || 0) > 0 ? "text-green-400" : (p.pointsDiff || 0) < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                                            {(p.pointsDiff || 0) > 0 ? "+" : ""}{p.pointsDiff || 0}
                                        </TableCell>
                                        <TableCell
                                            className={cn(
                                                "text-right font-bold",
                                                getWinRateColorClass(p.winRate)
                                            )}
                                        >
                                            {p.winRate.toFixed(0)}%
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}