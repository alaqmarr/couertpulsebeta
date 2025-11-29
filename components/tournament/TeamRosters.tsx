import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shirt } from "lucide-react";
import { PlayerLink } from "@/components/tournament/PlayerLink";

export async function TeamRosters({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            players: {
                include: { user: true }
            },
            tournamentTeams: {
                include: { players: true }
            }
        }
    });

    if (!tournament) return null;

    return (
        <div className="space-y-2">
            <h3 className="text-lg font-semibold">Team Rosters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tournament.tournamentTeams.map(tt => (
                    <Card key={tt.id} className="glass-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-base">
                                <span className="flex items-center gap-2">
                                    {tt.logoUrl ? (
                                        <img src={tt.logoUrl} alt={tt.name} className="w-6 h-6 object-contain rounded-sm" />
                                    ) : (
                                        <Shirt className="w-4 h-4 text-primary" />
                                    )}
                                    {tt.name}
                                </span>
                                <span className="text-xs font-normal text-muted-foreground">
                                    {tt.purseSpent} / {tournament.auctionPurse} pts
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {tournament.players
                                    .filter(p => p.teamId === tt.id)
                                    .map(p => (
                                        <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded bg-white/5">
                                            <PlayerLink player={p} />
                                            <span className="font-mono text-xs text-primary">{p.soldPrice} pts</span>
                                        </div>
                                    ))}
                                {tournament.players.filter(p => p.teamId === tt.id).length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">No players yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {tournament.tournamentTeams.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-12 col-span-2 border-2 border-dashed rounded-xl">
                        No teams registered yet.
                    </p>
                )}
            </div>
        </div>
    );
}
