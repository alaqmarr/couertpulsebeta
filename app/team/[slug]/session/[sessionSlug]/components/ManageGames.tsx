"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import {
    Loader2,
    Shuffle,
    PlusCircle,
    Users,
    Gamepad2,
    UserCheck,
    ListChecks,
    Trophy,
    Info,
    ArrowRightCircleIcon,
} from "lucide-react";
import {
    createGameAction,
    randomizeTeamsAction,
    submitGameScoreAction,
    togglePlayerAvailabilityAction,
} from "../session-actions.server";

interface ManageGamesProps {
    session: {
        id: string;
        slug: string | null;
        games: {
            id: string;
            slug: string;
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
}

export default function ManageGames({
    session,
    teamSlug,
    sessionSlug,
    isOwner,
}: ManageGamesProps) {
    const [loadingGames, setLoadingGames] = useState<Record<string, boolean>>({});
    const [scores, setScores] = useState<Record<string, { a: number; b: number }>>({});
    const [isPending, startTransition] = useTransition();
    const [isRandomizing, setRandomizing] = useState(false);
    const [teamA, setTeamA] = useState<string[]>([]);
    const [teamB, setTeamB] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [justCreated, setJustCreated] = useState(false);

    const members = session.team.members;
    const initiallySelected = session.participants
        .filter((p) => p.isSelected)
        .map((p) => p.memberId);
    const [selectedIds, setSelectedIds] = useState<string[]>(initiallySelected);

    const games = [...session.games].reverse();
    const prevGameCount = useRef(games.length);

    // Derived data
    const playerCount = selectedIds.length;
    const totalTeamPlayers = teamA.length + teamB.length;
    const matchType =
        totalTeamPlayers === 2 && teamA.length === 1 && teamB.length === 1
            ? "SINGLES"
            : "DOUBLES";
    const current = games[currentIndex];

    // Detect new game creation
    useEffect(() => {
        if (games.length > prevGameCount.current) {
            setCurrentIndex(0);
            setJustCreated(true);
            setTimeout(() => setJustCreated(false), 1500);
        }
        prevGameCount.current = games.length;
    }, [games.length]);

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
        const newSelected = selectedIds.includes(memberId)
            ? selectedIds.filter((id) => id !== memberId)
            : [...selectedIds, memberId];
        setSelectedIds(newSelected);

        if (selectedIds.includes(memberId)) {
            setTeamA((prev) => prev.filter((e) => e !== member.email));
            setTeamB((prev) => prev.filter((e) => e !== member.email));
        }

        startTransition(async () => {
            try {
                await togglePlayerAvailabilityAction(sessionSlug, memberId);
            } catch {
                toast.error("Failed to update availability");
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

    const handleCreateGame = () => {
        if (teamA.length < 1 || teamB.length < 1) {
            toast.error("Please select players for both teams.");
            return;
        }
        const expectedSize = matchType === "SINGLES" ? 1 : 2;
        if (teamA.length !== expectedSize || teamB.length !== expectedSize) {
            toast.error(`${matchType} matches require ${expectedSize} player(s) per team.`);
            return;
        }
        startTransition(async () => {
            try {
                await createGameAction(teamSlug, sessionSlug, matchType, teamA, teamB);
                toast.success(`Game created (${matchType.toLowerCase()})`);
                setTeamA([]);
                setTeamB([]);
            } catch (err: any) {
                toast.error(err.message || "Error creating game");
            }
        });
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

    const goPrev = () =>
        setCurrentIndex((p) => (p === 0 ? games.length - 1 : p - 1));
    const goNext = () =>
        setCurrentIndex((p) => (p === games.length - 1 ? 0 : p + 1));

    // Render
    return (
        <div className="flex flex-col gap-8">
            {/* === Session Availability === */}
            {isOwner && (
                <Card className="border border-primary/10 bg-card/70 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users size={18} className="text-primary" />
                            Session Availability
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                            Select members available for today’s session.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {members.map((m) => {
                                const isSelected = selectedIds.includes(m.id);
                                return (
                                    <Button
                                        key={m.id}
                                        variant={isSelected ? "default" : "outline"}
                                        onClick={() => handleToggleAvailability(m.id)}
                                        disabled={isPending}
                                        className="justify-start truncate"
                                    >
                                        {getPlayerName(m.email)}
                                    </Button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* === Manual Team Builder === */}
            {isOwner && selectedIds.length > 0 && (
                <Card className="border border-primary/10 bg-card/70 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck size={18} className="text-primary" />
                            Manual Team Builder
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                            Assign selected players to Team A or Team B.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {["A", "B"].map((team) => {
                                const currentTeam = team === "A" ? teamA : teamB;
                                return (
                                    <div key={team} className="rounded-lg border bg-background/50">
                                        <div className="p-2 border-b bg-muted/50 rounded-t-lg">
                                            <p className="font-medium text-sm">
                                                Team {team} ({currentTeam.length} player
                                                {currentTeam.length !== 1 ? "s" : ""})
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 p-2">
                                            {members
                                                .filter((m) => selectedIds.includes(m.id))
                                                .map((m) => {
                                                    const selected =
                                                        team === "A"
                                                            ? teamA.includes(m.email)
                                                            : teamB.includes(m.email);
                                                    return (
                                                        <Button
                                                            key={m.id}
                                                            variant={selected ? "default" : "outline"}
                                                            onClick={() =>
                                                                handleAssignPlayer(team as "A" | "B", m.id)
                                                            }
                                                            disabled={isPending}
                                                            className="justify-start truncate"
                                                        >
                                                            {getPlayerName(m.email)}
                                                        </Button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* === Game Controls === */}
            {isOwner && (
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={handleRandomizeTeams}
                        disabled={isRandomizing || isPending || playerCount < 2}
                        variant="outline"
                    >
                        {isRandomizing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Shuffle className="w-4 h-4 mr-1.5" />
                                Randomize ({matchType})
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={handleCreateGame}
                        disabled={isPending || totalTeamPlayers < 2}
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <PlusCircle className="w-4 h-4 mr-1.5" />
                                Create ({matchType}) Game
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* === Game History === */}
            <section>
                <Separator className="bg-border/50 mb-4" />
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                        <ListChecks size={16} className="text-primary" />
                        Game History
                    </h3>
                    <span className="text-sm text-muted-foreground">
                        {games.length} total matches
                    </span>
                </div>

                {games.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
                        <Info size={24} className="text-primary" />
                        <p className="text-muted-foreground text-sm">
                            No matches yet — create or randomize to start.
                        </p>
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center gap-4">
                        {/* === Single Match Card === */}
                        <Card
                            className={`w-full max-w-3xl bg-background/80 backdrop-blur border border-primary/10 rounded-xl shadow-md p-4 transition-all duration-700 ${justCreated ? "scale-[1.03] ring-2 ring-primary/40 shadow-lg" : ""
                                }`}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center border-b border-border/40 pb-2 mb-3">
                                <h4 className="text-sm font-semibold">
                                    Match {games.length - currentIndex}
                                </h4>
                                {current.winner ? (
                                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                        <UserCheck className="w-3 h-3" /> Completed
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Awaiting confirmation
                                    </span>
                                )}
                            </div>

                            {/* Teams */}
                            <div className="grid grid-cols-3 items-center gap-3 text-sm text-center">
                                <div
                                    className={`flex flex-col gap-1 ${current.winner === "A"
                                            ? "font-bold text-green-700"
                                            : current.winner === "B"
                                                ? "text-red-600"
                                                : ""
                                        }`}
                                >
                                    {current.teamAPlayers.map((p) => (
                                        <span key={p} className="uppercase">
                                            {getPlayerName(p)}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex justify-center">
                                    <img
                                        src="/vs.png"
                                        alt="vs"
                                        className={`w-[120px] h-auto opacity-85 transition-transform duration-700 ${justCreated ? "scale-110" : ""
                                            }`}
                                    />
                                </div>

                                <div
                                    className={`flex flex-col gap-1 ${current.winner === "B"
                                            ? "font-bold text-green-700"
                                            : current.winner === "A"
                                                ? "text-red-600 line-through"
                                                : ""
                                        }`}
                                >
                                    {current.teamBPlayers.map((p) => (
                                        <span key={p} className="uppercase">
                                            {getPlayerName(p)}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-border/40 mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex flex-col text-xs sm:text-sm text-muted-foreground">
                                    {current.winner ? (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                            <span>
                                                <span className="font-medium text-foreground">
                                                    Result:
                                                </span>{" "}
                                                <span className="text-green-700 font-semibold">
                                                    Team {current.winner} Victorious
                                                </span>
                                            </span>
                                            <span className="text-[11px] sm:text-xs text-muted-foreground">
                                                Final Score —{" "}
                                                <span className="font-semibold text-foreground">
                                                    {current.teamAScore} : {current.teamBScore}
                                                </span>
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="italic text-amber-600">
                                            Awaiting official score confirmation…
                                        </span>
                                    )}
                                </div>

                                {/* Score Inputs + Confirm */}
                                {isOwner && !current.winner && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <input
                                                min={0}
                                                max={21}
                                                placeholder="A"
                                                inputMode="numeric"
                                                className="w-14 sm:w-16 border border-border rounded-md p-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                value={scores[current.slug]?.a ?? ""}
                                                onChange={(e) =>
                                                    setScores((prev) => ({
                                                        ...prev,
                                                        [current.slug]: {
                                                            ...(prev[current.slug] || { a: 0, b: 0 }),
                                                            a: parseInt(e.target.value) || 0,
                                                        },
                                                    }))
                                                }
                                            />
                                            <span className="text-xs font-semibold">:</span>
                                            <input
                                                min={0}
                                                max={21}
                                                placeholder="B"
                                                inputMode="numeric"
                                                className="w-14 sm:w-16 border border-border rounded-md p-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                value={scores[current.slug]?.b ?? ""}
                                                onChange={(e) =>
                                                    setScores((prev) => ({
                                                        ...prev,
                                                        [current.slug]: {
                                                            ...(prev[current.slug] || { a: 0, b: 0 }),
                                                            b: parseInt(e.target.value) || 0,
                                                        },
                                                    }))
                                                }
                                            />
                                        </div>

                                        <Button
                                            size="sm"
                                            onClick={async () => {
                                                setLoadingGames((prev) => ({
                                                    ...prev,
                                                    [current.slug]: true,
                                                }));
                                                startTransition(async () => {
                                                    try {
                                                        await submitGameScoreAction(
                                                            teamSlug,
                                                            sessionSlug,
                                                            current.slug,
                                                            scores[current.slug]?.a ?? 0,
                                                            scores[current.slug]?.b ?? 0
                                                        );
                                                        toast.success("Scores submitted successfully");
                                                    } catch (err: any) {
                                                        toast.error(err.message || "Error submitting score");
                                                    } finally {
                                                        setLoadingGames((prev) => ({
                                                            ...prev,
                                                            [current.slug]: false,
                                                        }));
                                                    }
                                                });
                                            }}
                                            disabled={
                                                isPending ||
                                                loadingGames[current.slug] ||
                                                scores[current.slug]?.a === undefined ||
                                                scores[current.slug]?.b === undefined
                                            }
                                        >
                                            {loadingGames[current.slug] ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Trophy className="w-4 h-4 mr-1.5" />
                                                    Confirm
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Carousel Controls */}
                        <div className="flex items-center justify-center gap-4 mt-3">
                            <Button variant="outline" size="icon" onClick={goPrev}>
                                <ArrowRightCircleIcon className="w-4 h-4 rotate-180" />
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                {currentIndex + 1} / {games.length}
                            </p>
                            <Button variant="outline" size="icon" onClick={goNext}>
                                <ArrowRightCircleIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
