import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";
import { LoadingCard } from "@/components/LoadingCard";
import SessionLeaderboard from "./components/SessionLeaderboard";
import { SyncStatus } from "@/components/SyncStatus";
import { Badge } from "@/components/ui/badge";
import { SessionGamesWrapper } from "./components/SessionGamesWrapper";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ slug: string; sessionSlug: string }>;
}) {
  const { slug, sessionSlug } = await params;
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  // Minimal fetch for header
  const session = await prisma.session.findUnique({
    where: { slug: sessionSlug },
    select: {
      id: true,
      name: true,
      date: true,
      games: { select: { id: true } } // Just to count games
    }
  });

  if (!session) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background text-foreground p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8 h-full">
        {/* ---------------- HEADER ---------------- */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar size={28} className="text-primary" />
              {session.name || "Untitled Session"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(session.date).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SyncStatus />
            <Badge variant="outline" className="glass-badge-info bg-background/50 backdrop-blur-sm">
              {session.games.length} Games Played
            </Badge>
          </div>
        </header>

        <Separator className="bg-white/10" />

        {/* ---------------- TWO COLUMN LAYOUT ---------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ---------------- MAIN CONTENT (Left) ---------------- */}
          <div className="lg:col-span-2 space-y-8 flex flex-col justify-center min-h-[60vh]">
            {/* ---------------- GAME MANAGEMENT ---------------- */}
            <section className="w-full">
              <Suspense fallback={<LoadingCard title="Loading Games..." />}>
                <SessionGamesWrapper sessionSlug={sessionSlug} teamSlug={slug} />
              </Suspense>
            </section>
          </div>

          {/* ---------------- SIDEBAR (Right) ---------------- */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-8">
            {/* ---------------- LEADERBOARD ---------------- */}
            <Suspense fallback={<LoadingCard title="Loading Leaderboard..." />}>
              <SessionLeaderboard sessionId={session.id} />
            </Suspense>
          </aside>
        </div>
      </div>
    </main>
  );
}