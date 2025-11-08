import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoadingCard } from "@/components/LoadingCard";
import ManageGames from "./components/ManageGames";
import { getSessionLeaderboard } from "@/lib/leaderboard";
import SessionLeaderboard from "@/components/SessionLeaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SessionPage({
    params,
}: {
    params: Promise<{ slug: string; sessionSlug: string }>;
}) {
    const { slug, sessionSlug } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const session = await prisma.session.findUnique({
        where: { slug: sessionSlug },
        include: {
            team: {
                include: {
                    members: {
                        include: {
                            user: true,
                        },
                        orderBy: { joinedAt: "asc" },
                    },
                },
            },
            participants: {
                include: {
                    member: true,
                },
            },
            games: true,
        },
    });

    if (!session) notFound();

    const team = session.team;
    const isOwner = team.ownerId === user.id;

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="max-w-5xl mx-auto p-8 space-y-10">
                {/* ---------------- HEADER ---------------- */}
                <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {session.name || "Session"}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {team.name} • {new Date(session.date).toLocaleDateString("en-IN")}
                        </p>
                    </div>

                    {isOwner && (
                        <Button asChild variant="outline">
                            <a href={`/team/${slug}`}>Back to Team</a>
                        </Button>
                    )}
                </section>

                <Separator />

                {/* ---------------- GAME MANAGEMENT ---------------- */}
                <Suspense fallback={<LoadingCard title="Loading Games..." />}>
                    <ManageGames
                        session={{
                            id: session.id,
                            slug: session.slug,
                            games: session.games.map((g) => ({
                                id: g.id,
                                slug: g.slug,
                                teamAPlayers: g.teamAPlayers,
                                teamBPlayers: g.teamBPlayers,
                                winner: g.winner,
                            })),
                            team: {
                                members: session.team.members.map((m) => ({
                                    id: m.id,
                                    email: m.email,
                                    displayName: m.displayName,
                                    user: { name: m.user?.name ?? null },
                                })),
                            },
                            participants: session.participants.map((p) => ({
                                memberId: p.memberId,
                                isSelected: p.isSelected,
                            })),
                        }}
                        teamSlug={slug}
                        sessionSlug={sessionSlug}
                        isOwner={isOwner}
                    />
                </Suspense>

<Suspense fallback={<LoadingCard title="Calculating Leaderboard..." />}>
  <SessionLeaderboard sessionId={session.id} />
</Suspense>

            </div>
        </main>
    );
}
