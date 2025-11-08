// Imports (Data, UI, and Icons)
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import Link from "next/link"; // ✅ Import Link
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoadingCard } from "@/components/LoadingCard";

// Custom Components
import ManageGames from "./components/ManageGames";
import SessionLeaderboard from "@/components/SessionLeaderboard";
import { getSessionLeaderboard } from "@/lib/leaderboard";

// Icons
import { CalendarDays, ChevronLeft, Gamepad2, Trophy } from "lucide-react";

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

  // ... (data fetching logic remains the same) ...
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
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background text-foreground p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ---------------- HEADER ---------------- */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <CalendarDays size={28} className="text-primary" />
              {session.name || "Session"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 ml-10">
              {team.name} • {new Date(session.date).toLocaleDateString("en-IN")}
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href={`/team/${slug}`}>
              <ChevronLeft className="w-4 h-4 mr-1.5" />
              Back to Team
            </Link>
          </Button>
        </section>

        <Separator className="bg-border/50" />

        {/* ---------------- TWO COLUMN LAYOUT ---------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ---------------- MAIN CONTENT (Left) ---------------- */}
          <div className="lg:col-span-2 space-y-8">
            {/* ---------------- GAME MANAGEMENT ---------------- */}
            {/* 💡 TODO: Apply glass styles to your <ManageGames> component. 
                See instructions below. 
            */}
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
          </div>

          {/* ---------------- SIDEBAR (Right) ---------------- */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-8">
            {/* ---------------- SESSION LEADERBOARD ---------------- */}
            {/* 💡 TODO: Apply glass styles to your <SessionLeaderboard> component. 
                See instructions below. 
            */}
            <Suspense
              fallback={<LoadingCard title="Calculating Leaderboard..." />}
            >
              <SessionLeaderboard sessionId={session.id} />
            </Suspense>
          </aside>
        </div>
      </div>
    </main>
  );
}