"use client";

import { useState, useTransition } from "react";
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
} from "lucide-react";
import {
    createGameAction,
    randomizeTeamsAction,
    setGameWinnerAction,
    submitGameScoreAction,
    togglePlayerAvailabilityAction,
} from "../session-actions.server";

// ... (Interface props remain the same) ...
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

    const initiallySelected = session.participants
        .filter((p) => p.isSelected)
        .map((p) => p.memberId);

    const [selectedIds, setSelectedIds] = useState<string[]>(initiallySelected);
    const members = session.team.members;

    const [teamA, setTeamA] = useState<string[]>([]);
    const [teamB, setTeamB] = useState<string[]>([]);

    const playerCount = selectedIds.length;
    const totalTeamPlayers = teamA.length + teamB.length;

    const matchType =
        totalTeamPlayers === 2 && teamA.length === 1 && teamB.length === 1
            ? "SINGLES"
            : "DOUBLES";

    /* =========================================================
       UTILITIES (No changes needed)
     ========================================================= */
    const getPlayerName = (email: string) => {
        const m = members.find((x) => x.email === email);
        return (
            m?.displayName ||
            m?.user?.name ||
            email.split("@")[0] ||
            "Unnamed Player"
        );
    };
    const getMemberById = (id: string) => members.find((m) => m.id === id);

    /* =========================================================
       ACTIONS (No changes needed)
     ========================================================= */
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
            toast.error(
                `${matchType} matches require ${expectedSize} player(s) per team.`
            );
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
            toast.error(
                `At least ${required} available players required for ${matchType}.`
            );
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

    const handleSetWinner = (slug: string, winner: "A" | "B") => {
        startTransition(async () => {
            try {
                await setGameWinnerAction(teamSlug, sessionSlug, slug, winner);
                toast.success("Winner updated");
            } catch (err: any) {
                toast.error(err.message || "Error updating winner");
            }
        });
    };

    /* =========================================================
       RENDER
     ========================================================= */
    return (
        <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gamepad2 size={18} />
                    Manage Players & Games
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* ================= SECTION 1: PLAYER AVAILABILITY ================= */}
                {isOwner && (
                    <section>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Users size={16} className="text-primary" />
                                Session Availability
                            </h3>
                            <span className="text-sm text-muted-foreground">
                                {selectedIds.length} selected
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                            Select the members who are present for this session.
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
                    </section>
                )}

                {/* ================= SECTION 2: TEAM ASSIGNMENT ================= */}
                {isOwner && selectedIds.length > 0 && (
                    <section>
                        <Separator className="bg-border/50" />
                        <div className="pt-6">
                            <h3 className="font-semibold flex items-center gap-2">
                                <UserCheck size={16} className="text-primary" />
                                Manual Team Builder
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Manually assign available players to a team.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {["A", "B"].map((team) => {
                                    const currentTeam = team === "A" ? teamA : teamB;
                                    return (
                                        <div
                                            key={team}
                                            className="rounded-lg border bg-background/50"
                                        >
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
                        </div>
                    </section>
                )}

                {/* ================= SECTION 3: GAME CONTROLS ================= */}
                {isOwner && (
                    <section>
                        <Separator className="bg-border/50" />
                        <div className="pt-6 flex flex-wrap gap-2">
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
                    </section>
                )}

                {/* ================= SECTION 4: GAME LIST ================= */}
                <section>
                    <Separator className="bg-border/50" />
                    <div className="pt-6">
                        <h3 className="font-semibold flex items-center gap-2 mb-3">
                            <ListChecks size={16} className="text-primary" />
                            Game List ({session.games.length})
                        </h3>
                        {session.games.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
                                <Info size={24} className="text-primary" />
                                <p className="text-muted-foreground text-sm">
                                    No games yet. Create or randomize to start playing.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {session.games.map((g, i) => (
                                    <div
                                        key={g.id}
                                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center border border-primary/10 bg-muted/50 rounded-lg p-3"
                                    >
                                        <div className="mb-2 sm:mb-0">
                                            <p className="text-sm font-semibold">
                                                Match {i + 1}:{" "}
                                                {g.teamAPlayers.map(getPlayerName).join(" & ")} vs{" "}
                                                {g.teamBPlayers.map(getPlayerName).join(" & ")}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {g.winner ? (
                                                    <>
                                                        Winner:{" "}
                                                        <span className="font-semibold text-primary">
                                                            Team {g.winner}
                                                        </span>
                                                        {typeof g.teamAScore === "number" &&
                                                            typeof g.teamBScore === "number" &&
                                                            g.winner !== "DRAW" && (
                                                                <> won by {Math.abs(g.teamAScore - g.teamBScore)} points</>
                                                            )}
                                                        {g.winner === "DRAW" && " (Draw)"}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="flex row items-center gap-1">
                                                            <Loader2 className="w-2 h-2 animate-spin" />Awaiting result…
                                                        </span>
                                                    </>
                                                )}
                                            </p>

                                        </div>

                                        {isOwner && !g.winner && (
                                            <div className="flex flex-col sm:flex-row gap-2 items-center">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        defaultValue={0}
                                                        placeholder="A"
                                                        className="w-16 border rounded p-1 text-center"
                                                        value={scores[g.slug]?.a ?? ""}
                                                        onChange={(e) =>
                                                            setScores((prev) => ({
                                                                ...prev,
                                                                [g.slug]: {
                                                                    ...(prev[g.slug] || { a: 0, b: 0 }),
                                                                    a: parseInt(e.target.value) || 0,
                                                                },
                                                            }))
                                                        }
                                                    />
                                                    <span>:</span>
                                                    <input
                                                        defaultValue={0}
                                                        placeholder="B"
                                                        className="w-16 border rounded p-1 text-center"
                                                        value={scores[g.slug]?.b ?? ""}
                                                        onChange={(e) =>
                                                            setScores((prev) => ({
                                                                ...prev,
                                                                [g.slug]: {
                                                                    ...(prev[g.slug] || { a: 0, b: 0 }),
                                                                    b: parseInt(e.target.value) || 0,
                                                                },
                                                            }))
                                                        }
                                                    />
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={async () => {
                                                        setLoadingGames((prev) => ({ ...prev, [g.slug]: true }));
                                                        startTransition(async () => {
                                                            try {
                                                                await submitGameScoreAction(
                                                                    teamSlug,
                                                                    sessionSlug,
                                                                    g.slug,
                                                                    scores[g.slug]?.a ?? 0,
                                                                    scores[g.slug]?.b ?? 0
                                                                );
                                                                toast.success("Scores submitted");
                                                            } catch (err: any) {
                                                                toast.error(err.message || "Error submitting score");
                                                            } finally {
                                                                setLoadingGames((prev) => ({ ...prev, [g.slug]: false }));
                                                            }
                                                        });
                                                    }}
                                                    disabled={
                                                        isPending ||
                                                        loadingGames[g.slug] ||
                                                        scores[g.slug]?.a === undefined ||
                                                        scores[g.slug]?.b === undefined
                                                    }
                                                >
                                                    {loadingGames[g.slug] ? (
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
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </CardContent>
        </Card>
    );
}