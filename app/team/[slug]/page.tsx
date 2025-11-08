// Imports (Data, UI, and Icons)
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { LoadingCard } from "@/components/LoadingCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Custom Components (Black Boxes for now)
import AddMemberDrawer from "./components/AddMemberDrawer";
import MemberList from "./components/MemberList";
import SessionList from "./components/SessionList";
import TeamLeaderboard from "./components/TeamLeaderboard";
import PlayerStatsCard from "./components/PlayerStatsCard";
import { getTeamLeaderboard } from "@/lib/leaderboard";

// Icons
import {
    Shield,
    Users,
    Calendar,
    BarChartHorizontal,
    Trophy,
    Info,
} from "lucide-react";

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
        <main className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background text-foreground p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* ---------------- HEADER ---------------- */}
                <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Shield size={28} className="text-primary" />
                            {team.name}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 ml-10">
                            Created on {new Date(team.createdAt).toLocaleDateString("en-IN")}
                        </p>
                    </div>
                    {isOwner && <AddMemberDrawer slug={slug} />}
                </section>

                <Separator className="bg-border/50" />

                {/* ---------------- TWO COLUMN LAYOUT ---------------- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* ---------------- MAIN CONTENT (Left) ---------------- */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* ---------------- TEAM MEMBERS ---------------- */}
                        {/* 💡 TODO: Apply glass styles to your <MemberList> component. 
              See instructions below. 
            */}
                        <Suspense fallback={<LoadingCard title="Loading Members..." />}>
                            <MemberList members={team.members} slug={slug} isOwner={isOwner} />
                        </Suspense>

                        {/* ---------------- SESSIONS ---------------- */}
                        {/* 💡 TODO: Apply glass styles to your <SessionList> component. 
              See instructions below. 
            */}
                        <Suspense fallback={<LoadingCard title="Loading Sessions..." />}>
                            <SessionList team={team} />
                        </Suspense>

                        {/* ---------------- PLAYER PERFORMANCE GRID ---------------- */}
                        <section>
                            <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChartHorizontal size={18} />
                                        Individual Player Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {leaderboard.length === 0 ? (
                                        <EmptyState text="No games yet to calculate player stats." />
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                            {/* 💡 TODO: Apply glass/lift styles to your <PlayerStatsCard> component. 
                        See instructions below. 
                      */}
                                            {leaderboard.map((player: any) => (
                                                <PlayerStatsCard key={player.id} player={player} />
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </section>
                    </div>

                    {/* ---------------- SIDEBAR (Right) ---------------- */}
                    <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-8">
                        {/* ---------------- TEAM LEADERBOARD ---------------- */}
                        {/* 💡 TODO: Apply glass styles to your <TeamLeaderboard> component. 
              See instructions below. 
            */}
                        <Suspense fallback={<LoadingCard title="Computing Team Stats..." />}>
                            <TeamLeaderboard teamId={team.id} />
                        </Suspense>
                        

                        {/* ---------------- SUMMARY ---------------- */}
                        <section>
                            <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Info size={18} />
                                        Team Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <SummaryItem
                                        label="Games Played"
                                        value={team.sessions.reduce((a, s) => a + s.games.length, 0)}
                                    />
                                    <SummaryItem label="Total Sessions" value={team.sessions.length} />
                                    <SummaryItem label="Total Members" value={team.members.length} />
                                </CardContent>
                            </Card>
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}

// Helper components for a cleaner look
function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
            <Info size={24} className="text-primary" />
            <p className="text-muted-foreground text-sm text-center">{text}</p>
        </div>
    );
}

function SummaryItem({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded border">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground">{value}</span>
        </div>
    );
}