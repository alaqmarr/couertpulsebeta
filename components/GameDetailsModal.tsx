"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Users, Calendar, Medal, Swords } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface GameDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    game: {
        id: string;
        slug: string;
        teamAPlayers: string[];
        teamBPlayers: string[];
        teamAScore: number;
        teamBScore: number;
        winner: string | null;
        createdAt?: Date | string;
    };
    getPlayerName: (email: string) => string;
}

export default function GameDetailsModal({
    isOpen,
    onClose,
    game,
    getPlayerName,
}: GameDetailsModalProps) {
    const isWinnerA = game.winner === "A";
    const isWinnerB = game.winner === "B";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Swords className="w-5 h-5 text-primary" />
                        Match Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Scoreboard */}
                    <div className="flex items-center justify-between px-4">
                        {/* Team A */}
                        <div className={`flex flex-col items-center gap-2 ${isWinnerA ? "scale-110 transition-transform" : "opacity-80"}`}>
                            <div className="flex flex-col items-center">
                                {game.teamAPlayers.map((p) => (
                                    <span key={p} className="text-sm font-medium text-center max-w-[100px] truncate">
                                        {getPlayerName(p)}
                                    </span>
                                ))}
                            </div>
                            <span className={`text-4xl font-bold ${isWinnerA ? "text-green-500" : "text-foreground"}`}>
                                {game.teamAScore}
                            </span>
                            {isWinnerA && <Medal className="w-5 h-5 text-yellow-500" />}
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <span className="text-muted-foreground text-xs uppercase tracking-widest">VS</span>
                            <Separator className="w-8 bg-border/50" />
                        </div>

                        {/* Team B */}
                        <div className={`flex flex-col items-center gap-2 ${isWinnerB ? "scale-110 transition-transform" : "opacity-80"}`}>
                            <div className="flex flex-col items-center">
                                {game.teamBPlayers.map((p) => (
                                    <span key={p} className="text-sm font-medium text-center max-w-[100px] truncate">
                                        {getPlayerName(p)}
                                    </span>
                                ))}
                            </div>
                            <span className={`text-4xl font-bold ${isWinnerB ? "text-green-500" : "text-foreground"}`}>
                                {game.teamBScore}
                            </span>
                            {isWinnerB && <Medal className="w-5 h-5 text-yellow-500" />}
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Additional Stats / Info */}
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Trophy className="w-4 h-4" /> Winner
                            </span>
                            <span className="font-medium text-foreground">
                                {game.winner ? `Team ${game.winner}` : "In Progress"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Users className="w-4 h-4" /> Total Players
                            </span>
                            <span className="font-medium text-foreground">
                                {game.teamAPlayers.length + game.teamBPlayers.length}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Date
                            </span>
                            <span className="font-medium text-foreground">
                                {game.createdAt ? new Date(game.createdAt).toLocaleDateString() : "Today"}
                            </span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
