import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export async function TeamDetailsList({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            tournamentTeams: {
                include: {
                    players: true
                }
            }
        }
    });

    if (!tournament) return null;

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle>Team Details</CardTitle>
                <CardDescription>Detailed stats for each team.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {tournament.tournamentTeams.map(team => (
                        <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg bg-secondary/10">
                            <div className="flex items-center gap-3">
                                {team.logoUrl ? (
                                    <img src={team.logoUrl} alt={team.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                                        {team.name[0]}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold">{team.name}</p>
                                    <p className="text-xs text-muted-foreground">{team.players.length} Players</p>
                                </div>
                            </div>
                            <div className="text-right flex gap-4">
                                <div>
                                    <p className="font-bold text-green-500">{team.wins} Wins</p>
                                    <p className="text-xs text-muted-foreground">{team.matchesPlayed} Matches</p>
                                </div>
                                <div>
                                    <p className="font-bold text-primary">{team.points} Pts</p>
                                    <p className="text-xs text-muted-foreground">Net Run Rate (N/A)</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
