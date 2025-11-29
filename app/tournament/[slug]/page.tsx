import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TournamentHeader } from "@/components/tournament/TournamentHeader";
import { ActiveGames } from "@/components/tournament/ActiveGames";
import { TournamentStandings } from "@/components/tournament/TournamentStandings";
import { RecentGames } from "@/components/tournament/RecentGames";
import { LoadingState } from "@/components/ui/loading-state";

export default async function TournamentDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <Suspense fallback={<LoadingState title="Loading Tournament..." message="Fetching tournament details" />}>
        <TournamentHeader slug={slug} />
      </Suspense>

      {/* COURTSIDE ACTION (Active Games) */}
      <Suspense fallback={<LoadingState title="Checking Live Games..." message="Looking for active matches" />}>
        <ActiveGames slug={slug} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: STANDINGS */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<LoadingState title="Loading Standings..." message="Calculating team positions" />}>
            <TournamentStandings slug={slug} />
          </Suspense>
        </div>

        {/* RIGHT COLUMN: OTHER GAMES */}
        <div className="space-y-6">
          <Suspense fallback={<LoadingState title="Loading Schedule..." message="Fetching recent and upcoming games" />}>
            <RecentGames slug={slug} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
