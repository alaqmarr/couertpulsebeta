import { prisma } from "@/lib/db";
import { Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { notFound } from "next/navigation";

export async function TournamentHeader({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        select: {
            name: true,
            thumbnailUrl: true,
            startDate: true,
            isActive: true,
            _count: {
                select: { players: true }
            }
        }
    });

    if (!tournament) notFound();

    return (
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10 border border-white/10 p-6 md:p-10">
            {tournament.thumbnailUrl && (
                <div className="absolute inset-0 z-0 opacity-20">
                    <Image src={tournament.thumbnailUrl} alt={tournament.name} fill className="object-cover" />
                </div>
            )}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">{tournament.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1 text-sm bg-white/5 px-2 py-1 rounded">
                            <Calendar className="w-4 h-4" />
                            {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'}
                        </span>
                        <span className="flex items-center gap-1 text-sm bg-white/5 px-2 py-1 rounded">
                            <Users className="w-4 h-4" /> {tournament._count.players} Players
                        </span>
                        <Badge variant={tournament.isActive ? "default" : "secondary"}>
                            {tournament.isActive ? "Active" : "Completed"}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    );
}
