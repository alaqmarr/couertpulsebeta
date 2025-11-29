import { Suspense } from "react";
import { MatchScoreboardWrapper } from "@/components/tournament/MatchScoreboardWrapper";
import { MatchTimelineWrapper } from "@/components/tournament/MatchTimelineWrapper";
import { LoadingState } from "@/components/ui/loading-state";

export default async function MatchScoringPage({
    params,
}: {
    params: Promise<{ slug: string; matchId: string }>;
}) {
    const { slug, matchId } = await params;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Suspense fallback={<LoadingState title="Loading Scoreboard..." message="Connecting to live match data" />}>
                <MatchScoreboardWrapper slug={slug} matchId={matchId} />
            </Suspense>

            {/* Match Timeline */}
            <Suspense fallback={<LoadingState title="Loading Timeline..." message="Fetching match history" />}>
                <MatchTimelineWrapper matchId={matchId} />
            </Suspense>
        </div>
    );
}
