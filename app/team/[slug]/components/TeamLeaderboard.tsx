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
import { cn } from "@/lib/utils"; // Assuming you have this from shadcn

interface PlayerStats {
    id: string;
    name: string;
    plays: number;
    wins: number;
    losses: number;
    winRate: number;
}

/**
 * Helper function to determine Tailwind color class based on win rate.
 */
function getWinRateColorClass(winRate: number): string {
    if (winRate < 20) return "text-red-500";
    if (winRate < 40) return "text-red-400";
    if (winRate < 50) return "text-yellow-500";
    if (winRate < 60) return "text-yellow-400";
    if (winRate < 80) return "text-green-400";
    return "text-green-500";
}

export default function TeamLeaderboard({ teamId }: { teamId: string }) {
    const [isPending, startTransition] = useTransition();
    const [stats, setStats] = useState<PlayerStats[]>([]);

    useEffect(() => {
        startTransition(async () => {
            try {
                const res = await fetch(`/api/team/${teamId}/leaderboard`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setStats(data);
            } catch {
                toast.error("Failed to load leaderboard.");
            }
        });
    }, [teamId]);

    if (isPending && stats.length === 0) {
        return (
            <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy size={18} />
                        Team Leaderboard
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-24">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy size={18} />
                    Team Leaderboard
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {stats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
                        <Info size={24} className="text-primary" />
                        <p className="text-muted-foreground text-sm text-center">
                            No games played yet.
                            <br />
                            Leaderboard will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px] px-2">#</TableHead>
                                    <TableHead>Player</TableHead>
                                    <TableHead className="text-right">Plays</TableHead>
                                    <TableHead className="text-right">Wins</TableHead>
                                    <TableHead className="text-right">Losses</TableHead>
                                    <TableHead className="text-right">Win Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.map((p, index) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium px-2">
                                            {index === 0 ? (
                                                <Medal className="w-5 h-5 text-yellow-500" />
                                            ) : (
                                                index + 1
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell className="text-right">{p.plays}</TableCell>
                                        <TableCell className="text-right font-medium text-green-500">
                                            {p.wins}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-red-500">
                                            {p.losses}
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
            </CardContent>
        </Card>
    );
}