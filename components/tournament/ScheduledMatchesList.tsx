import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import Link from "next/link";

export async function ScheduledMatchesList({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            games: {
                where: { status: "SCHEDULED" },
                include: {
                    teamA: true,
                    teamB: true
                }
            }
        }
    });

    if (!tournament) return null;

    const scheduledGames = tournament.games;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Scheduled
            </h2>
            {scheduledGames.length === 0 ? (
                <p className="text-muted-foreground text-sm">No scheduled matches.</p>
            ) : (
                <div className="grid gap-4">
                    {scheduledGames.map(game => (
                        <Card key={game.id} className="glass-card">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="font-semibold">{game.teamA.name}</div>
                                    <div className="text-muted-foreground text-sm">vs</div>
                                    <div className="font-semibold">{game.teamB.name}</div>
                                </div>
                                <Button asChild size="sm" variant="outline">
                                    <Link href={`/tournament/${slug}/match/${game.id}`}>
                                        Start Match
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
