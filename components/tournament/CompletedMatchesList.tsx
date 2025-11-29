import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export async function CompletedMatchesList({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            games: {
                where: { status: "COMPLETED" },
                orderBy: { createdAt: 'desc' },
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
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-muted-foreground" /> Completed
            </h2>
            {completedGames.length === 0 ? (
                <p className="text-muted-foreground text-sm">No completed matches.</p>
            ) : (
                <div className="grid gap-4 opacity-75">
                    {completedGames.map(game => (
                        <Card key={game.id} className="glass-card bg-secondary/10">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={game.winningTeam === 'A' ? 'font-bold text-primary' : ''}>{game.teamA.name}</div>
                                    <div className="text-muted-foreground text-sm">vs</div>
                                    <div className={game.winningTeam === 'B' ? 'font-bold text-primary' : ''}>{game.teamB.name}</div>
                                </div>
                                <div className="font-mono text-sm">
                                    {game.teamAScore} - {game.teamBScore}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
