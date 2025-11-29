import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export async function PlayerPool({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            players: {
                include: { user: true }
            }
        }
    });

    if (!tournament) return null;

    const unsoldPlayers = tournament.players.filter(p => !p.teamId);

    return (
        <Card className="glass-card h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-primary" />
                    Player Pool ({unsoldPlayers.length})
                </CardTitle>
            </CardHeader>
            <div className="space-y-2 p-6 pt-0">
                <h3 className="text-lg font-semibold">Unsold Players</h3>
                {unsoldPlayers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {unsoldPlayers.map(player => (
                            <Card key={player.id} className="p-3 flex items-center justify-between text-sm">
                                <span>{player.name}</span>
                                <Button variant="ghost" size="sm">Sell</Button>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic">All players have been sold or no players added yet.</p>
                )}
            </div>
        </Card>
    );
}
