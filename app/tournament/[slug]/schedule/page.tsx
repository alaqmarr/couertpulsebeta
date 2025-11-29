import { Suspense } from "react";
import { ScheduleHeader } from "@/components/tournament/ScheduleHeader";
import { ScheduleBracket } from "@/components/tournament/ScheduleBracket";
import { ScheduleRoundList } from "@/components/tournament/ScheduleRoundList";
import { LoadingState } from "@/components/ui/loading-state";

export default async function TournamentSchedulePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    return (
        <div className="space-y-8">
            <Suspense fallback={<div className="h-20 animate-pulse bg-white/5 rounded-lg" />}>
                <ScheduleHeader slug={slug} />
            </Suspense>

            <Suspense fallback={<LoadingState title="Loading Bracket..." message="Drawing tournament tree" />}>
                <ScheduleBracket slug={slug} />
            </Suspense>

            <Suspense fallback={<LoadingState title="Loading Rounds..." message="Fetching match schedule" />}>
                <ScheduleRoundList slug={slug} />
            </Suspense>
        </div>
    );
}
