"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { Loader2, Shuffle, PlusCircle, Users } from "lucide-react";
import {
  createGameAction,
  randomizeTeamsAction,
  setGameWinnerAction,
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
  const [isPending, startTransition] = useTransition();
  const [isRandomizing, setRandomizing] = useState(false);

  // Convert participants into selected state
  const initiallySelected = session.participants
    .filter((p) => p.isSelected)
    .map((p) => p.memberId);

  const [selectedIds, setSelectedIds] = useState<string[]>(initiallySelected);
  const members = session.team.members;

  // Local teams for manual game setup - now store emails instead of IDs
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);

  const playerCount = selectedIds.length;
  const totalTeamPlayers = teamA.length + teamB.length;
  
  // Determine match type based on team composition
  const matchType =
    totalTeamPlayers === 2 && teamA.length === 1 && teamB.length === 1
      ? "SINGLES"
      : "DOUBLES";

  /* =========================================================
     UTILITIES
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
     TOGGLE SESSION AVAILABILITY
  ========================================================= */
  const handleToggleAvailability = (memberId: string) => {
    const member = getMemberById(memberId);
    if (!member) return;

    const newSelected = selectedIds.includes(memberId)
      ? selectedIds.filter((id) => id !== memberId)
      : [...selectedIds, memberId];
    setSelectedIds(newSelected);

    // Remove from teams if being deselected
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

  /* =========================================================
     TEAM ASSIGNMENT (for manual creation)
  ========================================================= */
  const handleAssignPlayer = (team: "A" | "B", memberId: string) => {
    if (!isOwner) return;
    const member = getMemberById(memberId);
    if (!member) return;

    const email = member.email;
    if (team === "A") {
      // Remove from team B first
      setTeamB((b) => b.filter((e) => e !== email));
      // Toggle in team A
      setTeamA((a) =>
        a.includes(email) ? a.filter((e) => e !== email) : [...a, email]
      );
    } else {
      // Remove from team A first
      setTeamA((a) => a.filter((e) => e !== email));
      // Toggle in team B
      setTeamB((b) =>
        b.includes(email) ? b.filter((e) => e !== email) : [...b, email]
      );
    }
  };

  /* =========================================================
     CREATE GAME - Now passes team assignments to server
  ========================================================= */
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

  /* =========================================================
     RANDOMIZE TEAMS
  ========================================================= */
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

  /* =========================================================
     MARK GAME WINNER
  ========================================================= */
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          Manage Players & Games
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* ================= PLAYER AVAILABILITY ================= */}
        {isOwner && (
          <div>
            <p className="text-sm font-medium mb-2">
              Session Availability ({selectedIds.length} selected)
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
                    className="justify-start"
                  >
                    {getPlayerName(m.email)}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TEAM ASSIGNMENT ================= */}
        {isOwner && selectedIds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {["A", "B"].map((team) => {
              const currentTeam = team === "A" ? teamA : teamB;
              return (
                <div key={team}>
                  <p className="text-sm font-medium mb-2">
                    Team {team} ({currentTeam.length} player{currentTeam.length !== 1 ? 's' : ''})
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {members
                      .filter((m) => selectedIds.includes(m.id))
                      .map((m) => {
                        const inA = teamA.includes(m.email);
                        const inB = teamB.includes(m.email);
                        const selected = team === "A" ? inA : inB;
                        return (
                          <Button
                            key={m.id}
                            variant={selected ? "default" : "outline"}
                            onClick={() =>
                              handleAssignPlayer(team as "A" | "B", m.id)
                            }
                            disabled={isPending}
                            className="justify-start"
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
        )}

        {/* ================= GAME CONTROLS ================= */}
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
                  <Shuffle className="w-4 h-4 mr-1" />
                  Randomize Teams ({matchType})
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
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Create {matchType} Game
                </>
              )}
            </Button>
          </div>
        )}

        {/* ================= GAME LIST ================= */}
        {session.games.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No games yet. Create or randomize to start playing.
          </p>
        ) : (
          <div className="space-y-3">
            {session.games.map((g, i) => (
              <div
                key={g.id}
                className="flex flex-col sm:flex-row justify-between items-center border rounded-lg p-3 bg-card"
              >
                <div>
                  <p className="text-sm font-semibold">
                    Match {i + 1}: {g.teamAPlayers.map(getPlayerName).join(", ")}{" "}
                    vs {g.teamBPlayers.map(getPlayerName).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {g.winner
                      ? `Winner: Team ${g.winner}`
                      : "Awaiting result..."}
                  </p>
                </div>

                {isOwner && !g.winner && (
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetWinner(g.slug, "A")}
                      disabled={isPending}
                    >
                      Team A
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetWinner(g.slug, "B")}
                      disabled={isPending}
                    >
                      Team B
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}