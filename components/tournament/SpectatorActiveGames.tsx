import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import Link from "next/link";

export async function SpectatorActiveGames({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            games: {
                where: { status: "IN_PROGRESS" },
                include: {
                    teamA: true,
                    teamB: true
                }
            }
        }
    });

    if (!tournament || tournament.games.length === 0) return null;

    const activeGames = tournament.games;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2 text-red-500 animate-pulse">
                <Activity className="w-6 h-6" /> Live Matches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeGames.map(game => (
                    <Link key={game.id} href={`/tournament/${slug}/match/${game.id}`}>
                        <Card className="glass-card hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                                    <span className="text-xs text-muted-foreground font-mono">Round {game.round}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col items-center gap-2 flex-1">
                                        <span className="font-bold text-sm text-center truncate w-full">{game.teamA?.name}</span>
                                        <span className="text-3xl font-mono font-bold">{game.teamAScore}</span>
                                    </div>
                                    <div className="text-muted-foreground font-mono text-sm">VS</div>
                                    <div className="flex flex-col items-center gap-2 flex-1">
                                        <span className="font-bold text-sm text-center truncate w-full">{game.teamB?.name}</span>
                                        <span className="text-3xl font-mono font-bold">{game.teamBScore}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
