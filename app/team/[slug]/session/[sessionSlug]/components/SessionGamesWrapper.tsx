import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { hasCapability } from "@/lib/permissions";
import ManageGames from "./ManageGames";

export async function SessionGamesWrapper({
    sessionSlug,
    teamSlug,
}: {
    sessionSlug: string;
    teamSlug: string;
}) {
    const user = await getOrCreateUser();

    const session = await prisma.session.findUnique({
        where: { slug: sessionSlug },
        include: {
            team: {
                include: {
                    members: {
                        include: {
                            user: true,
                        },
                        orderBy: { joinedAt: "asc" },
                    },
                },
            },
            participants: {
                include: {
                    member: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
            games: true,
        },
    });

    if (!session) return null;

    const team = session.team;
    const isOwner = user ? team.ownerId === user.id : false;
    const canSync = user ? hasCapability(user, "canSync") : false;

    return (
        <ManageGames
            session={{
                id: session.id,
                slug: session.slug,
                games: session.games.map((g) => ({
                    id: g.id,
                    slug: g.slug,
                    sessionId: g.sessionId,
                    teamAPlayers: g.teamAPlayers,
                    teamBPlayers: g.teamBPlayers,
                    teamAScore: g.teamAScore || 0,
                    teamBScore: g.teamBScore || 0,
                    winner: g.winner,
                })),
                team: {
                    members: session.team.members.map((m) => ({
                        id: m.id,
                        email: m.email,
                        displayName: m.displayName,
                        user: { name: m.user?.name ?? null },
                    })),
                },
                participants: session.participants.map((p) => ({
                    memberId: p.memberId,
                    isSelected: p.isSelected,
                })),
            }}
            teamSlug={teamSlug}
            sessionSlug={sessionSlug}
            isOwner={isOwner}
            canSync={canSync}
        />
    );
}
