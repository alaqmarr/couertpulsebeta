import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { LiveMatchScoreboard } from "@/components/tournament/LiveMatchScoreboard";
import { getOrCreateUser } from "@/lib/clerk";

export async function MatchScoreboardWrapper({ slug, matchId }: { slug: string; matchId: string }) {
    const user = await getOrCreateUser();
    const match = await prisma.tournamentGame.findUnique({
        where: { id: matchId },
        include: {
            teamA: { include: { players: true } },
            teamB: { include: { players: true } },
            tournament: { include: { members: true } },
        }
    });

    if (!match) notFound();

    // Verify Referee Access
    const currentUserMember = match.tournament.members.find(m => m.userId === user?.id);
    const isReferee = currentUserMember?.role === "REFEREE" || currentUserMember?.role === "MANAGER" || match.tournament.ownerId === user?.id;

    if (!isReferee) return <div className="p-4 text-center text-destructive">Access Denied</div>;

    return <LiveMatchScoreboard match={match} slug={slug} />;
}
