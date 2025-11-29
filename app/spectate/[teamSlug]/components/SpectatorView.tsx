"use client";

import LiveGameCard from "@/components/LiveGameCard";
import { Eye, Info, Activity } from "lucide-react";
import { useSessionGames } from "@/hooks/useSessionGames";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPlayerAvatar } from "@/lib/avatar-utils";

interface SpectatorViewProps {
    teamName: string;
    session: {
        id: string; // Added id
        name: string | null;
        date: Date;
        games: any[]; // Using any for simplicity with Prisma types, but could be stricter
        team: {
            members: {
                email: string;
                displayName: string | null;
                user: {
                    name: string | null;
                    image: string | null;
                } | null;
            }[];
        };
    };
}

export default function SpectatorView({ teamName, session }: SpectatorViewProps) {
    const getPlayerName = (email: string) => {
        const m = session.team.members.find((x) => x.email === email);
        return m?.displayName || m?.user?.name || email.split("@")[0] || "Player";
    };

    const getMemberAvatar = (email: string) => {
        const m = session.team.members.find((x) => x.email === email);
        if (!m) return getPlayerAvatar({ name: "Player" });
        return getPlayerAvatar({
            name: m.displayName || m.user?.name || email.split("@")[0],
            image: m.user?.image // Assuming user has image field from Prisma
        });
    };

    // Dummy confirm function for spectator (should never be called)
    const noopConfirm = async () => { };

    // --- REAL-TIME GAMES ---
    const { games: liveGames } = useSessionGames(
        session.id,
        session.games.map((g) => ({
            ...g,
            sessionId: session.id, // Ensure sessionId is passed
            teamAScore: g.teamAScore ?? 0,
            teamBScore: g.teamBScore ?? 0,
            winner: g.winner ?? null,
        }))
    );

    // Reverse for display order (newest first)
    const games = [...liveGames].reverse();

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background text-foreground p-4 md:p-6 lg:p-8 flex flex-col">
            <div className="max-w-4xl mx-auto w-full space-y-8 flex-1 flex flex-col justify-center">
                {/* Header */}
                <header className="text-center space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight text-primary drop-shadow-sm">
                        {teamName}
                    </h1>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 glass-badge-primary text-sm font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Live Spectator View
                    </div>
                    <p className="text-muted-foreground">
                        {session.name || "Untitled Session"} • {new Date(session.date).toLocaleDateString()}
                    </p>
                </header>

                {/* Live Games Grid */}
                <div className="grid grid-cols-1 gap-6 w-full">
                    {games.length === 0 ? (
                        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center gap-4">
                            <div className="p-4 rounded-full bg-primary/10 text-primary">
                                <Activity size={32} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-semibold">No Active Games</h3>
                                <p className="text-muted-foreground">
                                    Waiting for the next game to start...
                                </p>
                            </div>
                        </div>
                    ) : (
                        games.map((game) => (
                            <div key={game.id} className="relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-30"></div>
                                <LiveGameCard
                                    game={game}
                                    isOwner={false}
                                    getPlayerName={getPlayerName}
                                    getMemberAvatar={getMemberAvatar}
                                    onConfirm={async () => { }}
                                    justCreated={false}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
