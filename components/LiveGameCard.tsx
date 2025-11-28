"use client";

import { useLiveGame } from "@/hooks/useLiveGame";
import { Button } from "@/components/ui/button";
import { Loader2, Minus, Plus, Trophy, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import GameDetailsModal from "./GameDetailsModal";

interface LiveGameCardProps {
    game: {
        id: string;
        slug: string;
        sessionId: string; // Added sessionId
        teamAPlayers: string[];
        teamBPlayers: string[];
        teamAScore: number;
        teamBScore: number;
        winner: string | null;
    };
    isOwner: boolean;
    getPlayerName: (email: string) => string;
    onConfirm: (slug: string, scoreA: number, scoreB: number) => Promise<void>;
    justCreated?: boolean;
}

export default function LiveGameCard({
    game,
    isOwner,
    getPlayerName,
    onConfirm,
    justCreated,
}: LiveGameCardProps) {
    const { liveData, updateScore, finalizeGame } = useLiveGame(game.sessionId, game.id, {
        teamAScore: game.teamAScore,
        teamBScore: game.teamBScore,
    });



    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Use live data if available, otherwise fall back to Prisma data
    const scoreA = liveData ? liveData.teamAScore : game.teamAScore;
    const scoreB = liveData ? liveData.teamBScore : game.teamBScore;
    const isLive = !!liveData;

    const handleScoreChange = (team: "a" | "b", delta: number) => {
        if (!isOwner || game.winner) return;
        console.log("Updating score:", { sessionId: game.sessionId, gameId: game.id, team, delta });
        const current = team === "a" ? scoreA : scoreB;
        const newScore = Math.max(0, current + delta);
        updateScore(team, newScore).catch((err) => {
            console.error("Failed to update score:", err);
            toast.error("Failed to update score");
        });
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm(game.slug, scoreA, scoreB);

            // Determine winner to update Firebase
            let winner = "DRAW";
            if (scoreA > scoreB) winner = "A";
            else if (scoreB > scoreA) winner = "B";

            await finalizeGame(winner); // Update Firebase with winner and status
            toast.success("Game finalized!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to finalize game");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div
                onClick={() => setShowDetails(true)}
                className={`w-full max-w-3xl mx-auto glass-card rounded-xl p-4 cursor-pointer ${justCreated ? "scale-[1.03] ring-2 ring-primary/40 shadow-lg" : ""
                    }`}
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-border/40 pb-2 mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        {isLive && !game.winner && (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                        Match Details
                    </h4>
                    {game.winner ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                            <UserCheck className="w-3 h-3" /> Completed
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                            {isLive ? "Live Scoring" : "Ready to Start"}
                        </span>
                    )}
                </div>

                {/* Teams & Scores */}
                <div className="grid grid-cols-3 items-center gap-3 text-sm text-center">
                    {/* Team A */}
                    <div
                        className={`flex flex-col gap-1 ${game.winner === "A"
                            ? "font-bold text-green-700"
                            : game.winner === "B"
                                ? "text-red-600"
                                : ""
                            }`}
                    >
                        {game.teamAPlayers.map((p) => (
                            <span key={p} className="uppercase truncate">
                                {getPlayerName(p)}
                            </span>
                        ))}
                        {/* Score Controls A */}
                        {!game.winner && isOwner && (
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 glass-btn-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleScoreChange("a", -1);
                                    }}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-2xl font-bold w-10">{scoreA}</span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 glass-btn-primary" // Using primary (greenish) for plus
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleScoreChange("a", 1);
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        {/* Read-only Score A */}
                        {(game.winner || !isOwner) && (
                            <span className="text-2xl font-bold mt-2">{scoreA}</span>
                        )}
                    </div>

                    {/* VS / Divider */}
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-xs text-muted-foreground mb-1">VS</span>
                        <div className="h-8 w-[1px] bg-border/50"></div>
                    </div>

                    {/* Team B */}
                    <div
                        className={`flex flex-col gap-1 ${game.winner === "B"
                            ? "font-bold text-green-700"
                            : game.winner === "A"
                                ? "text-red-600 line-through"
                                : ""
                            }`}
                    >
                        {game.teamBPlayers.map((p) => (
                            <span key={p} className="uppercase truncate">
                                {getPlayerName(p)}
                            </span>
                        ))}
                        {/* Score Controls B */}
                        {!game.winner && isOwner && (
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 glass-btn-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleScoreChange("b", -1);
                                    }}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-2xl font-bold w-10">{scoreB}</span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 glass-btn-primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleScoreChange("b", 1);
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        {/* Read-only Score B */}
                        {(game.winner || !isOwner) && (
                            <span className="text-2xl font-bold mt-2">{scoreB}</span>
                        )}
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="border-t border-border/40 mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex flex-col text-xs sm:text-sm text-muted-foreground">
                        {game.winner ? (
                            <span className="text-green-700 font-semibold">
                                Team {game.winner} Won
                            </span>
                        ) : (
                            <span className="italic text-amber-600">
                                {isLive ? "Game in progress..." : "Waiting to start..."}
                            </span>
                        )}
                    </div>

                    {isOwner && !game.winner && (
                        <Button
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleConfirm();
                            }}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Trophy className="w-4 h-4 mr-1.5" />
                                    Finalize Game
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
            <GameDetailsModal
                isOpen={showDetails}
                onClose={() => setShowDetails(false)}
                game={{
                    ...game,
                    teamAScore: scoreA,
                    teamBScore: scoreB,
                }}
                getPlayerName={getPlayerName}
            />
        </>
    );
}
