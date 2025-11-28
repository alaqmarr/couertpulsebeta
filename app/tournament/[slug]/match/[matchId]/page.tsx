import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { updateMatchScoreAction, endMatchAction } from "../../../tournament.server";

export default async function MatchScoringPage({
    params,
}: {
    params: Promise<{ slug: string; matchId: string }>;
}) {
    const { slug, matchId } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const match = await prisma.tournamentGame.findUnique({
        where: { id: matchId },
        include: {
            teamA: true,
            teamB: true,
            tournament: {
                include: {
                    members: true
                }
            }
        }
    });

    if (!match) notFound();

    // Verify Referee Access
    const currentUserMember = match.tournament.members.find(m => m.userId === user.id);
    const isReferee = currentUserMember?.role === "REFEREE" || currentUserMember?.role === "MANAGER" || match.tournament.ownerId === user.id;

    if (!isReferee) return <div>Access Denied</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Match Scoring</h1>
                {match.completedAt ? (
                    <Badge variant="secondary">Completed</Badge>
                ) : (
                    <Badge variant="default" className="animate-pulse">Live</Badge>
                )}
            </div>

            {/* Scoreboard */}
            <Card className="glass-card border-primary/20">
                <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                        {/* Team A */}
                        <div className="text-center space-y-4 flex-1">
                            <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center text-2xl font-bold border-4 border-primary/20">
                                {match.teamA.logoUrl ? (
                                    <div className="w-full h-full relative rounded-full overflow-hidden">
                                        <Image src={match.teamA.logoUrl} alt={match.teamA.name} fill className="object-cover" />
                                    </div>
                                ) : (
                                    match.teamA.name.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <h2 className="font-bold text-lg text-center">{match.teamA.name}</h2>
                            <div className="text-6xl font-mono font-bold text-primary">
                                {match.teamAScore}
                            </div>
                            {!match.completedAt && (
                                <form action={updateMatchScoreAction} className="flex justify-center gap-2">
                                    <input type="hidden" name="matchId" value={match.id} />
                                    <input type="hidden" name="teamId" value={match.teamAId} />
                                    <input type="hidden" name="increment" value="1" />
                                    <Button size="sm" variant="outline"><Plus className="w-4 h-4" /> 1</Button>
                                </form>
                            )}
                        </div>

                        <div className="text-2xl font-bold text-muted-foreground">VS</div>

                        {/* Team B */}
                        <div className="text-center space-y-4 flex-1">
                            <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center text-2xl font-bold border-4 border-destructive/20">
                                {match.teamB.logoUrl ? (
                                    <div className="w-full h-full relative rounded-full overflow-hidden">
                                        <Image src={match.teamB.logoUrl} alt={match.teamB.name} fill className="object-cover" />
                                    </div>
                                ) : (
                                    match.teamB.name.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <h2 className="font-bold text-lg text-center">{match.teamB.name}</h2>
                            <div className="text-6xl font-mono font-bold text-destructive">
                                {match.teamBScore}
                            </div>
                            {!match.completedAt && (
                                <form action={updateMatchScoreAction} className="flex justify-center gap-2">
                                    <input type="hidden" name="matchId" value={match.id} />
                                    <input type="hidden" name="teamId" value={match.teamBId} />
                                    <input type="hidden" name="increment" value="1" />
                                    <Button size="sm" variant="outline"><Plus className="w-4 h-4" /> 1</Button>
                                </form>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Match Controls */}
            {!match.completedAt && (
                <div className="flex justify-center">
                    <form action={endMatchAction}>
                        <input type="hidden" name="matchId" value={match.id} />
                        <Button size="lg" variant="destructive">End Match</Button>
                    </form>
                </div>
            )}

            {/* Timeline / Events (Placeholder) */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-lg">Match Events</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* We can add a separate table for MatchEvents later */}
                        <p className="text-sm text-muted-foreground text-center italic">
                            Event logging coming soon.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
