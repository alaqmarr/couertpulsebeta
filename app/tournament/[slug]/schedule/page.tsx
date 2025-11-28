import { prisma } from "@/lib/db";

import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw, PlayCircle } from "lucide-react";
import { generateScheduleAction } from "../../tournament.server";
import Link from "next/link";

export default async function TournamentSchedulePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            members: true,
            games: {
                include: {
                    teamA: true,
                    teamB: true
                },
                orderBy: { round: 'asc' }
            },
            tournamentTeams: true
        }
    });

    if (!tournament) notFound();

    const isManager = tournament.members.some(m => m.userId === user.id && m.role === "MANAGER");
    const canManage = tournament.ownerId === user.id || isManager;

    // Group games by round
    const rounds = tournament.games.reduce((acc, game) => {
        const round = game.round || 1;
        if (!acc[round]) acc[round] = [];
        acc[round].push(game);
        return acc;
    }, {} as Record<number, typeof tournament.games>);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Calendar className="w-8 h-8 text-primary" /> Schedule
                    </h1>
                    <p className="text-muted-foreground">
                        Manage fixtures and match results.
                    </p>
                </div>
                {canManage && tournament.games.length === 0 && (
                    <form action={generateScheduleAction}>
                        <input type="hidden" name="slug" value={slug} />
                        <Button type="submit">
                            <RefreshCw className="w-4 h-4 mr-2" /> Generate Schedule
                        </Button>
                    </form>
                )}
            </div>

            {tournament.games.length === 0 ? (
                <Card className="glass-card border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <Calendar className="w-12 h-12 text-muted-foreground/50" />
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">No Matches Scheduled</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Once teams are finalized, generate the schedule to create a Round Robin fixture list.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(rounds).map(([round, games]) => (
                        <Card key={round} className="glass-card">
                            <CardHeader className="py-3 bg-white/5">
                                <CardTitle className="text-base font-medium">Round {round}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {games.map((game, index) => (
                                    <div
                                        key={game.id}
                                        className={`flex items-center justify-between p-4 ${index !== games.length - 1 ? "border-b border-white/5" : ""
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <span className="font-semibold text-right flex-1">{game.teamA?.name}</span>
                                            <div className="px-3 py-1 rounded bg-secondary text-xs font-mono">VS</div>
                                            <span className="font-semibold text-left flex-1">{game.teamB?.name}</span>
                                        </div>

                                        {canManage && (
                                            <Link href={`/tournament/${slug}/match/${game.id}`}>
                                                <Button variant="ghost" size="sm" className="ml-4">
                                                    <PlayCircle className="w-4 h-4 text-primary" />
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
