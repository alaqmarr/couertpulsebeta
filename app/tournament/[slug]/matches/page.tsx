import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Swords } from "lucide-react";
import { Suspense } from "react";
import { ActiveMatchesList } from "@/components/tournament/ActiveMatchesList";
import { ScheduledMatchesList } from "@/components/tournament/ScheduledMatchesList";
import { CompletedMatchesList } from "@/components/tournament/CompletedMatchesList";
import { LoadingState } from "@/components/ui/loading-state";

export default async function MatchesPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            members: {
                where: { userId: user.id }
            }
        }
    });

    if (!tournament) notFound();

    // Check permissions
    const userRole = tournament.members[0]?.role;
    const isManager = userRole === "MANAGER" || tournament.ownerId === user.id;
    const isReferee = userRole === "REFEREE";

    if (!isManager && !isReferee) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                <p className="text-muted-foreground">You must be a Manager or Referee to view this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Swords className="w-8 h-8 text-primary" /> Matches & Officiating
                    </h1>
                    <p className="text-muted-foreground">Manage and score matches.</p>
                </div>
            </div>

            {/* Active Matches */}
            <Suspense fallback={<LoadingState title="Loading Live Matches..." message="Checking for ongoing games" />}>
                <ActiveMatchesList slug={slug} />
            </Suspense>

            {/* Scheduled Matches */}
            <Suspense fallback={<LoadingState title="Loading Schedule..." message="Fetching upcoming matches" />}>
                <ScheduledMatchesList slug={slug} />
            </Suspense>

            {/* Completed Matches */}
            <Suspense fallback={<LoadingState title="Loading History..." message="Retrieving past results" />}>
                <CompletedMatchesList slug={slug} />
            </Suspense>
        </div>
    );
}
