import { prisma } from "@/lib/db";
import { PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export async function RecentGames({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            games: {
                where: {
                    status: {
                        in: ["COMPLETED", "SCHEDULED"]
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 10, // Fetch more to filter later if needed, but we need 5 of each ideally.
                include: {
                    teamA: true,
                    teamB: true
                }
            }
        }
    });

    if (!tournament) return null;

    const completedGames = tournament.games.filter(g => g.status === "COMPLETED").slice(0, 5);
    const scheduledGames = tournament.games.filter(g => g.status === "SCHEDULED").slice(0, 5);
    const gamesToShow = [...completedGames, ...scheduledGames];

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <PlayCircle className="w-4 h-4" /> Recent & Upcoming
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {gamesToShow.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No other matches.</p>
                ) : (
                    gamesToShow.map(game => (
                        <Link
                            key={game.id}
                            href={`/tournament/${slug}/match/${game.id}`}
                            className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                        >
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-xs text-muted-foreground">Round {game.round}</span>
                                <Badge variant={game.status === "COMPLETED" ? "secondary" : "outline"} className="text-[10px] h-5">
                                    {game.status === "COMPLETED" ? "Final" : "Scheduled"}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center font-semibold">
                                <div className="flex items-center gap-2">
                                    {game.teamA?.logoUrl && <div className="w-4 h-4 relative rounded-full overflow-hidden"><Image src={game.teamA.logoUrl} alt="" fill className="object-cover" /></div>}
                                    <span>{game.teamA?.name}</span>
                                </div>
                                <span className="font-mono text-muted-foreground text-xs">vs</span>
                                <div className="flex items-center gap-2">
                                    <span>{game.teamB?.name}</span>
                                    {game.teamB?.logoUrl && <div className="w-4 h-4 relative rounded-full overflow-hidden"><Image src={game.teamB.logoUrl} alt="" fill className="object-cover" /></div>}
                                </div>
                            </div>
                            {game.status === "COMPLETED" && (
                                <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground px-1">
                                    <span className="font-mono">{game.teamAScore}</span>
                                    <span className="font-mono">{game.teamBScore}</span>
                                </div>
                            )}
                        </Link>
                    ))
                )}
                <Link href={`/tournament/${slug}/schedule`}>
                    <Button variant="outline" className="w-full mt-2" size="sm">View Full Schedule</Button>
                </Link>
            </CardContent>
        </Card>
    );
}
