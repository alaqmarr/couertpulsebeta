import { prisma } from "@/lib/db";
import MemberList from "@/app/team/[slug]/components/MemberList";
import { getOrCreateUser } from "@/lib/clerk";

export async function TeamMembers({ slug }: { slug: string }) {
    const user = await getOrCreateUser();
    const team = await prisma.team.findUnique({
        where: { slug },
        include: {
            members: {
                include: { user: true },
                orderBy: { joinedAt: "asc" },
            },
        },
    });

    if (!team) return null;

    const isOwner = user ? team.ownerId === user.id : false;

    return <MemberList members={team.members} slug={slug} isOwner={isOwner} />;
}
