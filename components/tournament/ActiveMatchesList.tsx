import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import Link from "next/link";

export async function ActiveMatchesList({ slug }: { slug: string }) {
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

    if (!tournament) return null;

    const activeGames = tournament.games;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-green-500" /> Live Matches
            </h2>
            {activeGames.length === 0 ? (
                <p className="text-muted-foreground text-sm">No matches currently in progress.</p>
            ) : (
                <div className="grid gap-4">
                    {activeGames.map(game => (
                        <Card key={game.id} className="glass-card border-green-500/20">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="font-bold text-lg">{game.teamA.name}</div>
                                    <div className="text-muted-foreground">vs</div>
                                    <div className="font-bold text-lg">{game.teamB.name}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-xl font-mono font-bold">
                                        {game.teamAScore} - {game.teamBScore}
                                    </div>
                                    <Button asChild size="sm" variant="default">
                                        <Link href={`/tournament/${slug}/match/${game.id}`}>
                                            Continue Scoring
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
