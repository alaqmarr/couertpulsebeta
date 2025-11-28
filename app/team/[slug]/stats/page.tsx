import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LoadingCard } from "@/components/LoadingCard";
import { cn } from "@/lib/utils";

// Custom Components
import TeamLeaderboard from "./Leaderboard";
import PlayerStatsGrid from "@/components/PlayerStatsGrid";

// Icons
import { BarChart3, Users2, Info } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function TeamStatsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const team = await prisma.team.findUnique({
        where: { slug },
        include: {
            owner: true,
            members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
            sessions: {
                include: { games: true },
                orderBy: { date: "desc" },
            },
            pairStats: true,
        },
    });

    if (!team) notFound();

    const totalGames = team.sessions.reduce((a, s) => a + s.games.length, 0);

    return (
        <main className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background text-foreground p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* ---------------- HEADER ---------------- */}
                <section>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <BarChart3 size={28} className="text-primary" />
                        {team.name}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 ml-10">
                        Public Statistics — {team.members.length} members, {totalGames} games
                    </p>
                </section>

                <Separator className="bg-white/10" />

                {/* ---------------- TWO COLUMN LAYOUT ---------------- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* ---------------- MAIN CONTENT (Left) ---------------- */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* ---------------- PLAYER STATS ---------------- */}
                        <section className="glass-panel p-6">
                            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                                <Users2 size={22} />
                                Individual Player Performance
                            </h2>
                            <Suspense
                                fallback={<LoadingCard title="Loading Player Stats..." />}
                            >
                                <PlayerStatsGrid teamId={team.id} />
                            </Suspense>
                        </section>

                        {/* ---------------- PAIR PERFORMANCE ---------------- */}
                        <section className="glass-panel p-6">
                            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                                <Users2 size={22} />
                                Best Pairs
                            </h2>
                            {team.pairStats.length === 0 ? (
                                <EmptyState text="No pair statistics available yet." />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {team.pairStats
                                        .sort((a, b) => b.wins - a.wins)
                                        .slice(0, 6)
                                        .map(async (pair) => {
                                            const winRate =
                                                pair.plays > 0
                                                    ? (pair.wins / pair.plays) * 100
                                                    : 0;
                                            const winRateColor = getWinRateColorClass(winRate);

                                            return (
                                                <div
                                                    key={pair.id}
                                                    className="glass-card rounded-xl border-primary/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
                                                >
                                                    <div className="p-6">
                                                        <div className="text-lg font-semibold mb-2">
                                                            {await getNamefromDb(pair.playerA)} & {await getNamefromDb(pair.playerB)}
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-sm">
                                                                <p className="font-medium text-foreground">
                                                                    {pair.wins} Wins
                                                                </p>
                                                                <p className="text-muted-foreground">
                                                                    {pair.plays} Matches
                                                                </p>
                                                            </div>
                                                            <div
                                                                className={cn(
                                                                    "text-2xl font-bold text-right",
                                                                    winRateColor
                                                                )}
                                                            >
                                                                {winRate.toFixed(0)}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ---------------- SIDEBAR (Right) ---------------- */}
                    <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-8">
                        {/* ---------------- TEAM LEADERBOARD ---------------- */}
                        <Suspense
                            fallback={<LoadingCard title="Loading Leaderboard..." />}
                        >
                            <TeamLeaderboard teamId={team.id} />
                        </Suspense>
                    </aside>
                </div>
            </div>
        </main>
    );
}

// Helper component for empty state
function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/5">
            <Info size={24} className="text-primary" />
            <p className="text-muted-foreground text-sm text-center">{text}</p>
        </div>
    );
}

async function getNamefromDb(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return email;
    if (!user.name && !user?.displayName) {
        const name = await prisma.teamMember.findFirst({
            where: { email: email },
            select: { displayName: true }
        });
        return name?.displayName || email;
    }

    return user?.name || user?.displayName || email;
}