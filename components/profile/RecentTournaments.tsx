import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy } from "lucide-react";

export async function RecentTournaments() {
    const user = await getOrCreateUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            tournamentPlayers: {
                include: {
                    tournament: true,
                    team: true
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            }
        }
    });

    if (!dbUser) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Recent Tournaments
            </h2>
            {dbUser.tournamentPlayers.length === 0 ? (
                <p className="text-muted-foreground">No tournament history yet.</p>
            ) : (
                <div className="grid gap-4">
                    {dbUser.tournamentPlayers.map((tp) => (
                        <Card key={tp.id} className="glass-card hover:bg-white/5 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                                        <Trophy className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{tp.tournament.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Team: {tp.team?.name || "No Team"} • Sold: {tp.soldPrice}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={tp.tournament.isActive ? "default" : "secondary"}>
                                    {tp.tournament.isActive ? "Active" : "Completed"}
                                </Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
