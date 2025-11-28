import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import SpectatorView from "./components/SpectatorView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SpectatorPage({
    params,
}: {
    params: Promise<{ teamSlug: string }>;
}) {
    const { teamSlug } = await params;

    // 1. Fetch Team
    const team = await prisma.team.findUnique({
        where: { slug: teamSlug },
        select: { id: true, name: true, slug: true },
    });

    if (!team) notFound();

    // 2. Find Active Session (Today or most recent within 24h)
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    const session = await prisma.session.findFirst({
        where: {
            teamId: team.id,
            OR: [
                { date: { gte: startOfDay, lte: endOfDay } }, // Today's session
                { games: { some: { createdAt: { gte: startOfDay } } } } // Or session with games created today
            ]
        },
        include: {
            games: {
                orderBy: { createdAt: "desc" },
            },
            team: {
                include: {
                    members: {
                        include: { user: true }
                    }
                }
            }
        },
        orderBy: { date: "desc" },
    });

    if (!session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
                <h1 className="text-2xl font-bold">{team.name} Spectator View</h1>
                <p className="text-muted-foreground">No active session found for today.</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background p-4 md:p-6 lg:p-8">
            <SpectatorView teamName={team.name} session={session} />
        </main>
    );
}
