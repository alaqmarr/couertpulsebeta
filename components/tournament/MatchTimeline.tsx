"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Trophy, AlertCircle, Clock, RotateCcw } from "lucide-react";

import { PlayerLink } from "./PlayerLink";

interface MatchEvent {
    id: string;
    type: string;
    timestamp: Date;
    scoreA: number;
    scoreB: number;
    player?: {
        id: string;
        name: string;
        userId?: string | null;
        team: {
            name: string;
        };
    };
    metadata?: any;
}

interface MatchTimelineProps {
    events: MatchEvent[];
}

export function MatchTimeline({ events }: MatchTimelineProps) {
    if (events.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                No events recorded yet.
            </div>
        );
    }

    return (
        <ScrollArea className="h-[300px] w-full pr-4">
            <div className="space-y-4">
                {events.map((event) => (
                    <div key={event.id} className="flex gap-3 items-start text-sm">
                        <div className="mt-0.5">
                            {event.type === "POINT_SCORED" && <Trophy className="w-4 h-4 text-yellow-500" />}
                            {event.type === "FAULT" && <AlertCircle className="w-4 h-4 text-destructive" />}
                            {event.type === "TIMEOUT" && <Clock className="w-4 h-4 text-blue-500" />}
                            {event.type === "UNDO" && <RotateCcw className="w-4 h-4 text-muted-foreground" />}
                            {(event.type === "GAME_START" || event.type === "GAME_END") && (
                                <Clock className="w-4 h-4 text-green-500" />
                            )}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between">
                                <span className="font-medium">
                                    {event.type === "POINT_SCORED" ? "Point Scored" : event.type.replace("_", " ")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(event.timestamp), "h:mm:ss a")}
                                </span>
                            </div>

                            {event.player && (
                                <p className="text-muted-foreground">
                                    by <PlayerLink player={event.player} className="text-foreground" /> ({event.player.team.name})
                                </p>
                            )}

                            <div className="text-xs font-mono bg-secondary/50 px-2 py-1 rounded w-fit">
                                Score: {event.scoreA} - {event.scoreB}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
