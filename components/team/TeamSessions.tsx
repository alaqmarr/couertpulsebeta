import { prisma } from "@/lib/db";
import SessionList from "@/app/team/[slug]/components/SessionList";

export async function TeamSessions({ slug }: { slug: string }) {
    const team = await prisma.team.findUnique({
        where: { slug },
        include: {
            sessions: {
                include: { games: true },
                orderBy: { date: "desc" },
            },
        },
    });

    if (!team) return null;

    return <SessionList team={team} />;
}
