"use client";

import { useEffect, useState, useTransition } from "react";
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
import { getTeamLeaderboard } from "@/app/actions/leaderboard";

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
                const data = await getTeamLeaderboard(teamId);
                setStats(data);
            } catch {
                toast.error("Failed to load leaderboard.");
            }
        });
    }, [teamId]);


    if (isPending && stats.length === 0) {
        return (
            <div className="glass-card rounded-xl border-primary/10">
                <div className="p-6">
                    <div className="flex items-center gap-2 font-semibold text-lg mb-4">
                        <Trophy size={18} className="text-primary" />
                        Team Leaderboard
                    </div>
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-xl border-primary/10">
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 font-semibold text-lg">
                    <Trophy size={18} className="text-primary" />
                    Team Leaderboard
                </div>
                <div>
                    {stats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/5">
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
                                    <TableRow className="hover:bg-transparent border-white/10">
                                        <TableHead className="w-[40px] px-2">#</TableHead>
                                        <TableHead>Player</TableHead>
                                        <TableHead className="text-right">M</TableHead>
                                        <TableHead className="text-right">W</TableHead>
                                        <TableHead className="text-right">L</TableHead>
                                        <TableHead className="text-right">W %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.map((p, index) => (
                                        <TableRow key={p.id} className="hover:bg-white/5 border-white/5">
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
                </div>
            </div>
        </div>
    );
}