import { prisma } from "@/lib/db";
import TeamLeaderboard from "@/app/team/[slug]/components/TeamLeaderboard";

export async function TeamSidebarLeaderboard({ slug }: { slug: string }) {
    const team = await prisma.team.findUnique({
        where: { slug },
        select: { id: true }
    });

    if (!team) return null;

    return <TeamLeaderboard teamId={team.id} />;
}
