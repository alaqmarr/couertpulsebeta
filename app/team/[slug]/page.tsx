import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import AddMemberDrawer from "./components/AddMemberDrawer";
import MemberList from "./components/MemberList";
import SessionList from "./components/SessionList";
import { LoadingCard } from "@/components/LoadingCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import TeamLeaderboard from "./components/TeamLeaderboard";
import PlayerStatsCard from "./components/PlayerStatsCard"; // ✅ new import
import { getTeamLeaderboard } from "@/lib/leaderboard"; // ✅ assuming you have this util

export const dynamic = "force-dynamic";
export const revalidate = 0; // Always fresh SSR

export default async function TeamPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const team = await prisma.team.findUnique({
        where: { slug },
        include: {
            owner: true,
            members: {
                include: { user: true },
                orderBy: { joinedAt: "asc" },
            },
            sessions: {
                include: { games: true },
                orderBy: { date: "desc" },
            },
        },
    });

    if (!team) notFound();

    const isOwner = team.ownerId === user.id;

    // ✅ Compute leaderboard stats for all players
    const leaderboard = await getTeamLeaderboard(team.id);

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="max-w-6xl mx-auto p-8 space-y-10">
                {/* ---------------- HEADER ---------------- */}
                <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Created on {new Date(team.createdAt).toLocaleDateString("en-IN")}
                        </p>
                    </div>
                    {isOwner && <AddMemberDrawer slug={slug} />}
                </section>

                <Separator />

                {/* ---------------- TEAM MEMBERS ---------------- */}
                <Suspense fallback={<LoadingCard title="Loading Members..." />}>
                    <MemberList members={team.members} slug={slug} isOwner={isOwner} />
                </Suspense>

                {/* ---------------- SESSIONS ---------------- */}
                <Suspense fallback={<LoadingCard title="Loading Sessions..." />}>
                    <SessionList team={team} />
                </Suspense>

                {/* ---------------- TEAM LEADERBOARD ---------------- */}
                <Suspense fallback={<LoadingCard title="Computing Team Stats..." />}>
                    <TeamLeaderboard teamId={team.id} />
                </Suspense>

                {/* ---------------- PLAYER PERFORMANCE GRID ---------------- */}
                <section>
                    <Card>
                        <CardHeader>
                            <CardTitle>Individual Player Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {leaderboard.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No games yet to calculate player stats.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
                                    {leaderboard.map((player: any) => (
                                        <PlayerStatsCard key={player.id} player={player} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* ---------------- SUMMARY ---------------- */}
                <section>
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            <p>
                                Games Played:{" "}
                                {team.sessions.reduce((a, s) => a + s.games.length, 0)}
                            </p>
                            <p>Total Sessions: {team.sessions.length}</p>
                            <p>Total Members: {team.members.length}</p>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    );
}
