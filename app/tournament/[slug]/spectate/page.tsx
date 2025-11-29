import { Suspense } from "react";
import { SpectatorHeader } from "@/components/tournament/SpectatorHeader";
import { SpectatorActiveGames } from "@/components/tournament/SpectatorActiveGames";
import { SpectatorStandings } from "@/components/tournament/SpectatorStandings";
import { SpectatorRecentResults } from "@/components/tournament/SpectatorRecentResults";
import { LoadingState } from "@/components/ui/loading-state";

export default async function SpectatorPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    return (
        <div className="space-y-8">
            {/* Header */}
            <Suspense fallback={<div className="h-24 animate-pulse bg-white/5 rounded-lg" />}>
                <SpectatorHeader slug={slug} />
            </Suspense>

            {/* Active Games */}
            <Suspense fallback={<LoadingState title="Checking Live Games..." message="Connecting to courtside feed" />}>
                <SpectatorActiveGames slug={slug} />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Standings */}
                <div className="lg:col-span-2 space-y-6">
                    <Suspense fallback={<LoadingState title="Calculating Standings..." message="Updating team positions" />}>
                        <SpectatorStandings slug={slug} />
                    </Suspense>
                </div>

                {/* Recent Results */}
                <div className="space-y-6">
                    <Suspense fallback={<LoadingState title="Loading Results..." message="Fetching recent scores" />}>
                        <SpectatorRecentResults slug={slug} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
