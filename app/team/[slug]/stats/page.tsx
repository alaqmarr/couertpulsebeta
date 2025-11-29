import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { LoadingCard } from "@/components/LoadingCard";

// Custom Components
import TeamLeaderboard from "./Leaderboard";
import PlayerStatsGrid from "@/components/PlayerStatsGrid";
import { TeamPairStats } from "./components/TeamPairStats";

// Icons
import { BarChart3, Users2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeamStatsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Minimal fetch for header
    const team = await prisma.team.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            members: { select: { id: true } },
            sessions: { select: { games: { select: { id: true } } } }
        }
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
                        <Suspense fallback={<LoadingCard title="Loading Pair Stats..." />}>
                            <TeamPairStats teamId={team.id} />
                        </Suspense>
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