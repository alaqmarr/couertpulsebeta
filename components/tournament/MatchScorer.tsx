"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateMatchScoreAction } from "@/app/tournament/tournament.server";
import { toast } from "react-hot-toast";

interface Player {
    id: string;
    name: string;
}

interface Team {
    id: string;
    name: string;
    players: Player[];
}

interface MatchScorerProps {
    matchId: string;
    team: Team;
    score: number;
    isTeamA: boolean;
    disabled?: boolean;
    slug: string;
}

export function MatchScorer({ matchId, team, score, isTeamA, disabled, slug }: MatchScorerProps) {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`text-6xl font-mono font-bold ${isTeamA ? "text-primary" : "text-destructive"}`}>
                {score}
            </div>

            {!disabled && (
                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                    <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select Scorer (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unknown">Unknown / Team</SelectItem>
                            {team.players.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <form action={updateMatchScoreAction} className="w-full" onSubmit={() => setIsSubmitting(true)}>
                        <input type="hidden" name="matchId" value={matchId} />
                        <input type="hidden" name="teamId" value={team.id} />
                        <input type="hidden" name="increment" value="1" />
                        <input type="hidden" name="playerId" value={selectedPlayerId === "unknown" ? "" : selectedPlayerId} />
                        <input type="hidden" name="slug" value={slug} />

                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            disabled={isSubmitting}
                            type="submit"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Point
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
