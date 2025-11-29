import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TournamentBracket } from "@/components/tournament/TournamentBracket";

export async function ScheduleBracket({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            games: {
                include: {
                    teamA: true,
                    teamB: true
                },
                orderBy: { round: 'asc' }
            }
        }
    });

    if (!tournament || tournament.games.length === 0) return null;

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle>Bracket Visualization</CardTitle>
            </CardHeader>
            <CardContent>
                <TournamentBracket
                    matches={tournament.games.map((game) => ({
                        id: game.id,
                        round: game.round,
                        matchNumber: 0,
                        status: game.status,
                        winner: game.winningTeam === "A" ? "A" : game.winningTeam === "B" ? "B" : undefined,
                        teamA: {
                            id: game.teamAId,
                            name: game.teamA.name,
                            score: game.teamAScore,
                            winner: game.winningTeam === "A",
                        },
                        teamB: {
                            id: game.teamBId,
                            name: game.teamB.name,
                            score: game.teamBScore,
                            winner: game.winningTeam === "B",
                        },
                    }))}
                />
            </CardContent>
        </Card>
    );
}
