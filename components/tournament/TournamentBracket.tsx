"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Team {
    id: string;
    name: string;
    score?: number;
    winner?: boolean;
}

interface Match {
    id: string;
    round: number;
    matchNumber: number;
    teamA?: Team;
    teamB?: Team;
    status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
    winner?: "A" | "B";
}

interface TournamentBracketProps {
    matches: Match[];
}

export function TournamentBracket({ matches }: TournamentBracketProps) {
    // Group matches by round
    const rounds = matches.reduce((acc, match) => {
        if (!acc[match.round]) acc[match.round] = [];
        acc[match.round].push(match);
        return acc;
    }, {} as Record<number, Match[]>);

    const roundNumbers = Object.keys(rounds)
        .map(Number)
        .sort((a, b) => a - b);

    return (
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex p-8 gap-16 min-w-max">
                {roundNumbers.map((round) => (
                    <div key={round} className="flex flex-col justify-around gap-8">
                        <div className="text-center font-bold text-muted-foreground mb-4">
                            Round {round}
                        </div>
                        <div className="flex flex-col justify-around flex-1 gap-8">
                            {rounds[round]
                                .sort((a, b) => a.matchNumber - b.matchNumber)
                                .map((match) => (
                                    <MatchCard key={match.id} match={match} />
                                ))}
                        </div>
                    </div>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}

function MatchCard({ match }: { match: Match }) {
    return (
        <div className="w-64 relative">
            <Card className="p-0 overflow-hidden border-2">
                {/* Team A */}
                <div
                    className={cn(
                        "flex justify-between items-center p-3 border-b",
                        match.winner === "A" && "bg-green-50 dark:bg-green-900/20",
                        !match.teamA && "text-muted-foreground italic"
                    )}
                >
                    <span className="truncate font-medium">
                        {match.teamA?.name || "TBD"}
                    </span>
                    {match.teamA?.score !== undefined && (
                        <span className="font-bold ml-2">{match.teamA.score}</span>
                    )}
                </div>

                {/* Team B */}
                <div
                    className={cn(
                        "flex justify-between items-center p-3",
                        match.winner === "B" && "bg-green-50 dark:bg-green-900/20",
                        !match.teamB && "text-muted-foreground italic"
                    )}
                >
                    <span className="truncate font-medium">
                        {match.teamB?.name || "TBD"}
                    </span>
                    {match.teamB?.score !== undefined && (
                        <span className="font-bold ml-2">{match.teamB.score}</span>
                    )}
                </div>
            </Card>

            {/* Connector lines could be added here with absolute positioning */}
        </div>
    );
}
