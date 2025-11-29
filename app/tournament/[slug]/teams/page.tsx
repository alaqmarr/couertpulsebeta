import { Suspense } from "react";
import { CreateTeamForm } from "@/components/tournament/CreateTeamForm";
import { PlayerPool } from "@/components/tournament/PlayerPool";
import { TeamRosters } from "@/components/tournament/TeamRosters";
import { LoadingState } from "@/components/ui/loading-state";
import { LoadingCard } from "@/components/LoadingCard";

export default async function TournamentTeamsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Teams & Players</h1>
                    <p className="text-muted-foreground">Manage the player pool and team rosters.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* TEAM MANAGEMENT */}
                <div className="md:col-span-1 space-y-4">
                    <CreateTeamForm slug={slug} />
                </div>

                {/* PLAYER POOL & ROSTERS */}
                <div className="md:col-span-2 space-y-4">
                    <Suspense fallback={<LoadingCard title="Loading Players..." />}>
                        <PlayerPool slug={slug} />
                    </Suspense>

                    <Suspense fallback={<LoadingState title="Loading Rosters..." message="Fetching team details" />}>
                        <TeamRosters slug={slug} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
