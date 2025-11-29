import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function SpectatorHeader({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        select: { name: true }
    });

    if (!tournament) notFound();

    return (
        <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">{tournament.name}</h1>
            <p className="text-muted-foreground">Spectator View • Live Scores & Standings</p>
        </div>
    );
}
