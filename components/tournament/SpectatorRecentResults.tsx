import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export async function SpectatorRecentResults({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            games: {
                where: { status: "COMPLETED" },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    teamA: true,
                    teamB: true
                }
            }
        }
    });

    if (!tournament) return null;

    const completedGames = tournament.games;

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="w-4 h-4" /> Recent Results
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {completedGames.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No completed matches.</p>
                ) : (
                    completedGames.map(game => (
                        <div key={game.id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="flex justify-between items-center font-semibold">
                                <span>{game.teamA?.name}</span>
                                <span className="font-mono text-muted-foreground text-xs">vs</span>
                                <span>{game.teamB?.name}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground px-1">
                                <span className="font-mono text-primary font-bold">{game.teamAScore}</span>
                                <span className="font-mono text-primary font-bold">{game.teamBScore}</span>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
