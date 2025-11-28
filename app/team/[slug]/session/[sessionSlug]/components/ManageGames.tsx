"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
    Loader2,
    Shuffle,
    PlusCircle,
    Users,
    UserCheck,
    ListChecks,
    Info,
    ArrowRightCircleIcon,
    RefreshCw, // New icon
} from "lucide-react";
import {
    createGameAction,
    randomizeTeamsAction,
    submitGameScoreAction,
    togglePlayerAvailabilityAction,
    syncSessionAction, // New action
} from "../session-actions.server";

import LiveGameCard from "@/components/LiveGameCard";
import { useSessionParticipants } from "@/hooks/useSessionParticipants";
import { useSessionGames } from "@/hooks/useSessionGames";
import { SyncStatus } from "@/components/SyncStatus";
import { useSessionSync } from "@/hooks/useSessionSync";

interface ManageGamesProps {
    session: {
        id: string;
        slug: string | null;
        games: {
            id: string;
            slug: string;
            sessionId: string;
            teamAPlayers: string[];
            teamBPlayers: string[];
            teamAScore: number | 0;
            teamBScore: number | 0;
            winner: string | null;
        }[];
        team: {
            members: {
                id: string;
                email: string;
                displayName: string | null;
                user: { name: string | null } | null;
            }[];
        };
        participants: { memberId: string; isSelected: boolean }[];
    };
    teamSlug: string;
    sessionSlug: string;
    isOwner: boolean;
    canSync: boolean;
}

export default function ManageGames({
    session,
    teamSlug,
    sessionSlug,
    isOwner,
    canSync,
}: ManageGamesProps) {
    const router = useRouter();
    const { data: syncData } = useSessionSync(session.id);

    // router.refresh() removed to prevent aggressive server re-fetching.
    // Real-time updates are handled by useSessionGames and useSessionParticipants.
    const [isPending, startTransition] = useTransition();
    const [isRandomizing, setRandomizing] = useState(false);
    const [teamA, setTeamA] = useState<string[]>([]);
    const [teamB, setTeamB] = useState<string[]>([]);
    const [matchType, setMatchType] = useState<"SINGLES" | "DOUBLES">("DOUBLES");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [justCreated, setJustCreated] = useState(false);

    const members = session.team.members;

    // --- REAL-TIME HOOK ---
    const { participants, toggleAvailability } = useSessionParticipants(
        session.id,
        session.participants.map(p => ({
            id: p.memberId, // Using memberId as ID for simplicity in Firebase map
            memberId: p.memberId,
            displayName: members.find(m => m.id === p.memberId)?.displayName || "Player",
            isSelected: p.isSelected
        }))
    );

    // Derived selected IDs from real-time data
    const selectedIds = participants.filter(p => p.isSelected).map(p => p.memberId);
    // ----------------------

    // --- REAL-TIME GAMES ---
    const { games: liveGames } = useSessionGames(
        session.id,
        session.games.map(g => ({
            ...g,
            teamAScore: g.teamAScore ?? 0,
            teamBScore: g.teamBScore ?? 0,
            winner: g.winner ?? null
        }))
    );

    // Use liveGames instead of session.games, and reverse for display order
    const games = [...liveGames].reverse();
    const prevGameCount = useRef(games.length);

    // Derived data
    const playerCount = selectedIds.length;
    const totalTeamPlayers = teamA.length + teamB.length;

    // Detect new game creation
    useEffect(() => {
        if (games.length > prevGameCount.current) {
            setCurrentIndex(0);
            setJustCreated(true);
            setTimeout(() => setJustCreated(false), 1500);
        }
        prevGameCount.current = games.length;
    }, [games.length]);

    // --- REAL-TIME TEAMS SYNC ---
    useEffect(() => {
        if (!session.id) return;
        const teamsRef = ref(rtdb, `sessions/${session.id}/generatedTeams`);
        const unsubscribe = onValue(teamsRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.timestamp) {
                if (data.teamA) setTeamA(data.teamA);
                if (data.teamB) setTeamB(data.teamB);
                if (data.matchType) setMatchType(data.matchType);
            }
        });
        return () => unsubscribe();
    }, [session.id]);
    // ----------------------------

    // Utils
    const getPlayerName = (email: string) => {
        const m = members.find((x) => x.email === email);
        return m?.displayName || m?.user?.name || email.split("@")[0] || "Unnamed Player";
    };

    const getMemberById = (id: string) => members.find((m) => m.id === id);

    // Actions
    const handleToggleAvailability = (memberId: string) => {
        const member = getMemberById(memberId);
        if (!member) return;

        const isCurrentlySelected = selectedIds.includes(memberId);

        // 1. Instant Firebase Update
        toggleAvailability(memberId, isCurrentlySelected, {
            displayName: getPlayerName(member.email)
        });

        // 2. Clear from teams if removing
        if (isCurrentlySelected) {
            setTeamA((prev) => prev.filter((e) => e !== member.email));
            setTeamB((prev) => prev.filter((e) => e !== member.email));
        }

        // 3. Background Sync to Postgres
        startTransition(async () => {
            try {
                await togglePlayerAvailabilityAction(sessionSlug, memberId);
            } catch {
                toast.error("Failed to sync availability to DB");
            }
        });
    };

    const handleAssignPlayer = (team: "A" | "B", memberId: string) => {
        if (!isOwner) return;
        const member = getMemberById(memberId);
        if (!member) return;
        const email = member.email;
        if (team === "A") {
            setTeamB((b) => b.filter((e) => e !== email));
            setTeamA((a) =>
                a.includes(email) ? a.filter((e) => e !== email) : [...a, email]
            );
        } else {
            setTeamA((a) => a.filter((e) => e !== email));
            setTeamB((b) =>
                b.includes(email) ? b.filter((e) => e !== email) : [...b, email]
            );
        }
    };

    const [isCreating, setIsCreating] = useState(false);

    const handleCreateGame = async () => {
        if (teamA.length < 1 || teamB.length < 1) {
            toast.error("Please select players for both teams.");
            return;
        }
        const expectedSize = matchType === "SINGLES" ? 1 : 2;
        if (teamA.length !== expectedSize || teamB.length !== expectedSize) {
            toast.error(`${matchType} matches require ${expectedSize} player(s) per team.`);
            return;
        }

        setIsCreating(true);
        try {
            // No startTransition here - we want instant UI feedback via Firebase hook
            await createGameAction(teamSlug, sessionSlug, matchType, teamA, teamB);
            toast.success(`Game created (${matchType.toLowerCase()})`);
            setTeamA([]);
            setTeamB([]);
        } catch (err: any) {
            toast.error(err.message || "Error creating game");
        } finally {
            setIsCreating(false);
        }
    };

    const handleRandomizeTeams = async () => {
        const required = matchType === "SINGLES" ? 2 : 4;
        if (playerCount < required) {
            toast.error(`At least ${required} available players required for ${matchType}.`);
            return;
        }
        setRandomizing(true);
        try {
            await randomizeTeamsAction(teamSlug, sessionSlug, matchType);
            toast.success("Teams randomized successfully.");
        } catch (err: any) {
            toast.error(err.message || "Error randomizing teams");
        } finally {
            setRandomizing(false);
        }
    };

    const handleManualSync = () => {
        if (!canSync) {
            toast.error("Upgrade to Pro to use Manual Sync");
            return;
        }
        startTransition(async () => {
            try {
                await syncSessionAction(session.id);
                toast.success("Data synced with database");
            } catch {
                toast.error("Sync failed");
            }
        });
    };

    const handleConfirmScore = async (slug: string, scoreA: number, scoreB: number) => {
        await submitGameScoreAction(teamSlug, sessionSlug, slug, scoreA, scoreB);
    };

    const goPrev = () =>
        setCurrentIndex((p) => (p === 0 ? games.length - 1 : p - 1));
    const goNext = () =>
        setCurrentIndex((p) => (p === games.length - 1 ? 0 : p + 1));

    const current = games[currentIndex];

    // Render
    return (
        <div className="space-y-8">
            {/* --- GAME MANAGEMENT PANEL --- */}
            <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Shuffle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            Game Management
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Create matches and track scores in real-time.
                        </p>
                    </div>
                    <SyncStatus />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                    {/* LEFT COLUMN: Availability & Teams */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* === Session Availability === */}
                        {isOwner && (
                            <div className="glass-card rounded-lg p-3 sm:p-4">
                                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                    <Users size={16} className="text-primary" />
                                    <h3 className="font-semibold text-sm sm:text-base">Session Availability</h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {members.map((m) => {
                                        const isSelected = selectedIds.includes(m.id);
                                        return (
                                            <Button
                                                key={m.id}
                                                variant={isSelected ? "default" : "outline"}
                                                onClick={() => handleToggleAvailability(m.id)}
                                                className={`justify-start truncate h-8 sm:h-9 text-[10px] sm:text-xs transition-all duration-300 ${isSelected ? "shadow-md" : "glass-item hover:bg-white/5 border-white/10"}`}
                                            >
                                                {getPlayerName(m.email)}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* === Manual Team Builder === */}
                        {isOwner && selectedIds.length > 0 && (
                            <div className="glass-card rounded-lg p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div className="flex items-center gap-2">
                                        <UserCheck size={16} className="text-primary" />
                                        <h3 className="font-semibold text-sm sm:text-base">Team Builder</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={matchType === "DOUBLES" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => setMatchType("DOUBLES")}
                                            className="h-6 sm:h-7 text-[10px] sm:text-xs"
                                        >
                                            Doubles
                                        </Button>
                                        <Button
                                            variant={matchType === "SINGLES" ? "secondary" : "ghost"}
                                            size="sm"
                                            onClick={() => setMatchType("SINGLES")}
                                            className="h-6 sm:h-7 text-[10px] sm:text-xs"
                                        >
                                            Singles
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    {["A", "B"].map((team) => {
                                        const currentTeam = team === "A" ? teamA : teamB;
                                        return (
                                            <div key={team} className="glass-item rounded-md overflow-hidden">
                                                <div className="p-2 border-b border-white/5 bg-white/5 text-center">
                                                    <p className="font-medium text-xs">
                                                        Team {team}
                                                    </p>
                                                </div>
                                                <div className="p-2 min-h-[80px] space-y-1">
                                                    {currentTeam.map(email => (
                                                        <div key={email} className="text-xs px-2 py-1 bg-white/5 rounded border border-white/10 truncate">
                                                            {getPlayerName(email)}
                                                        </div>
                                                    ))}
                                                    {currentTeam.length === 0 && (
                                                        <p className="text-[10px] text-muted-foreground text-center py-4">
                                                            Empty
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="p-2 border-t border-white/5 bg-white/5">
                                                    <div className="flex flex-wrap gap-1">
                                                        {members
                                                            .filter((m) => selectedIds.includes(m.id) && !teamA.includes(m.email) && !teamB.includes(m.email))
                                                            .map((m) => (
                                                                <Button
                                                                    key={m.id}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleAssignPlayer(team as "A" | "B", m.id)}
                                                                    className="h-6 text-[10px] px-2 py-0 glass-btn-primary border-primary/30 hover:bg-primary/20"
                                                                >
                                                                    + {getPlayerName(m.email).split(" ")[0]}
                                                                </Button>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button
                                        onClick={handleRandomizeTeams}
                                        disabled={isRandomizing || isPending || playerCount < 2}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        {isRandomizing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Shuffle className="w-4 h-4 mr-1.5" />
                                                Randomize
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleCreateGame}
                                        disabled={isCreating || totalTeamPlayers < 2}
                                        className="flex-1 glass-button"
                                    >
                                        {isCreating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <PlusCircle className="w-4 h-4 mr-1.5" />
                                                Start Game
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Live Game & History */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <ListChecks size={18} className="text-primary" />
                                Live Match
                            </h3>
                            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                                {games.length} matches total
                            </span>
                        </div>

                        {games.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 p-12 border-2 border-dashed border-primary/10 rounded-xl bg-muted/5">
                                <Info size={32} className="text-primary/50" />
                                <p className="text-muted-foreground text-sm">
                                    No matches yet — create or randomize to start.
                                </p>
                            </div>
                        ) : (
                            <div className="relative flex flex-col items-center gap-4">
                                {/* === Single Match Card (Live) === */}
                                <div className="w-full">
                                    <LiveGameCard
                                        game={current}
                                        isOwner={isOwner}
                                        getPlayerName={getPlayerName}
                                        onConfirm={handleConfirmScore}
                                        justCreated={justCreated}
                                    />
                                </div>

                                {/* Carousel Controls */}
                                <div className="flex items-center justify-center gap-4 bg-card/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5">
                                    <Button variant="ghost" size="icon" onClick={goPrev} className="h-8 w-8 rounded-full">
                                        <ArrowRightCircleIcon className="w-5 h-5 rotate-180 text-muted-foreground" />
                                    </Button>
                                    <p className="text-xs font-medium tabular-nums">
                                        Match {games.length - currentIndex} of {games.length}
                                    </p>
                                    <Button variant="ghost" size="icon" onClick={goNext} className="h-8 w-8 rounded-full">
                                        <ArrowRightCircleIcon className="w-5 h-5 text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
