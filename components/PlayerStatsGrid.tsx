import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/app/team/[slug]/stats/circular-progress"; // Assuming this is a client component
import { cn } from "@/lib/utils"; // Import your utility function
import { Info } from "lucide-react";

/**
 * Helper function to determine Tailwind color class based on win rate.
 */
function getWinRateColorClass(winRate: number): string {
    if (winRate < 20) return "text-red-500";
    if (winRate < 40) return "text-red-400";
    if (winRate < 50) return "text-yellow-500";
    if (winRate < 60) return "text-yellow-400";
    if (winRate < 80) return "text-green-400";
    return "text-green-500";
}

/**
 * Computes and displays per-player stats grid using CircularProgress indicators.
 */
export default async function PlayerStatsGrid({ teamId }: { teamId: string }) {
    const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
            members: { include: { user: true } },
            sessions: { include: { games: true } },
        },
    });

    if (!team) return null;

    // ... (Data fetching and aggregation logic is unchanged) ...
    const playerStats = new Map<
        string,
        { plays: number; wins: number; losses: number }
    >();

    for (const session of team.sessions) {
        for (const game of session.games) {
            const all = [...game.teamAPlayers, ...game.teamBPlayers];
            for (const email of all) {
                const stat =
                    playerStats.get(email) ?? { plays: 0, wins: 0, losses: 0 };
                stat.plays++;
                const won =
                    (game.winner === "A" && game.teamAPlayers.includes(email)) ||
                    (game.winner === "B" && game.teamBPlayers.includes(email));
                if (won) stat.wins++;
                else stat.losses++;
                playerStats.set(email, stat);
            }
        }
    }

    const players = Array.from(playerStats.entries())
        .map(([email, s]) => {
            const member = team.members.find((m) => m.email === email);
            const name =
                member?.displayName ||
                member?.user?.name ||
                email.split("@")[0] ||
                "Unnamed";
            const winRate = s.plays > 0 ? (s.wins / s.plays) * 100 : 0;
            return { name, plays: s.plays, wins: s.wins, losses: s.losses, winRate };
        })
        .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

    // --- Refactored Empty State ---
    if (players.length === 0)
        return (
            <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
                <Info size={24} className="text-primary" />
                <p className="text-muted-foreground text-sm">
                    No player data available yet.
                </p>
            </div>
        );

    // --- Refactored Grid ---
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((p) => {
                const winRateColor = getWinRateColorClass(p.winRate);
                return (
                    <Card
                        key={p.name}
                        className="bg-card/70 backdrop-blur-sm border border-primary/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
                    >
                        <CardHeader className="text-center">
                            <CardTitle className="text-lg font-semibold truncate">
                                {p.name}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex flex-col items-center">
                            <CircularProgress
                                value={p.winRate}
                                color={winRateColor} // Use the new consistent color
                                size={90}
                            />
                            <div className="flex justify-between w-full text-sm mt-4">
                                <div className="text-center flex-1">
                                    <span className="text-xs text-muted-foreground">Played</span>
                                    <p className="font-semibold">{p.plays}</p>
                                </div>
                                <div className="text-center flex-1">
                                    <span className="text-xs text-green-500">Wins</span>
                                    <p className="font-semibold text-green-500">{p.wins}</p>
                                </div>
                                <div className="text-center flex-1">
                                    <span className="text-xs text-red-500">Losses</span>
                                    <p className="font-semibold text-red-500">{p.losses}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}