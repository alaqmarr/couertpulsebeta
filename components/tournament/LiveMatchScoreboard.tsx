"use client";

import { useLiveMatch } from "@/hooks/useLiveMatch";
import { MatchScorer } from "./MatchScorer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { undoMatchScoreAction, endMatchAction } from "@/app/tournament/tournament.server";

interface LiveMatchScoreboardProps {
    match: any; // Type this properly if possible, or use the Prisma type
    slug: string;
}

export function LiveMatchScoreboard({ match, slug }: LiveMatchScoreboardProps) {
    const liveData = useLiveMatch(match.id, {
        teamAScore: match.teamAScore,
        teamBScore: match.teamBScore,
        status: match.status,
        completedAt: match.completedAt ? match.completedAt.toISOString() : null,
    });

    // Use live data or fallback to initial match data
    const teamAScore = liveData?.teamAScore ?? match.teamAScore;
    const teamBScore = liveData?.teamBScore ?? match.teamBScore;
    const status = liveData?.status ?? match.status;
    const isCompleted = status === "COMPLETED" || !!liveData?.completedAt;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Match Scoring</h1>
                {isCompleted ? (
                    <Badge variant="secondary">Completed</Badge>
                ) : (
                    <Badge variant="default" className="animate-pulse">
                        Live
                    </Badge>
                )}
            </div>

            {/* Scoreboard */}
            <Card className="glass-card border-primary/20">
                <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                        {/* Team A */}
                        <div className="text-center space-y-4 flex-1">
                            <Link href={`/tournament/${slug}/team/${match.teamA.id}`} className="block group">
                                <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center text-2xl font-bold border-4 border-primary/20 group-hover:border-primary transition-colors">
                                    {match.teamA.logoUrl ? (
                                        <div className="w-full h-full relative rounded-full overflow-hidden">
                                            <Image
                                                src={match.teamA.logoUrl}
                                                alt={match.teamA.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        match.teamA.name.substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                <h2 className="font-bold text-lg text-center mt-4 group-hover:text-primary transition-colors">
                                    {match.teamA.name}
                                </h2>
                            </Link>
                            <MatchScorer
                                matchId={match.id}
                                team={{
                                    id: match.teamA.id,
                                    name: match.teamA.name,
                                    players: match.teamA.players.map((p: any) => ({
                                        id: p.id,
                                        name: p.name,
                                    })),
                                }}
                                score={teamAScore}
                                isTeamA={true}
                                disabled={isCompleted}
                                slug={slug}
                            />
                        </div>

                        <div className="text-2xl font-bold text-muted-foreground">VS</div>

                        {/* Team B */}
                        <div className="text-center space-y-4 flex-1">
                            <Link href={`/tournament/${slug}/team/${match.teamB.id}`} className="block group">
                                <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center text-2xl font-bold border-4 border-destructive/20 group-hover:border-destructive transition-colors">
                                    {match.teamB.logoUrl ? (
                                        <div className="w-full h-full relative rounded-full overflow-hidden">
                                            <Image
                                                src={match.teamB.logoUrl}
                                                alt={match.teamB.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        match.teamB.name.substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                <h2 className="font-bold text-lg text-center mt-4 group-hover:text-destructive transition-colors">
                                    {match.teamB.name}
                                </h2>
                            </Link>
                            <MatchScorer
                                matchId={match.id}
                                team={{
                                    id: match.teamB.id,
                                    name: match.teamB.name,
                                    players: match.teamB.players.map((p: any) => ({
                                        id: p.id,
                                        name: p.name,
                                    })),
                                }}
                                score={teamBScore}
                                isTeamA={false}
                                disabled={isCompleted}
                                slug={slug}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Match Controls */}
            {!isCompleted && (
                <div className="flex justify-center gap-4">
                    <form action={undoMatchScoreAction}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="matchId" value={match.id} />
                        <Button size="lg" variant="secondary">
                            Undo Last Point
                        </Button>
                    </form>
                    <form action={endMatchAction}>
                        <input type="hidden" name="matchId" value={match.id} />
                        <Button size="lg" variant="destructive">
                            End Match
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
