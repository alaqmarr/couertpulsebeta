import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw } from "lucide-react";
import { generateScheduleAction } from "@/app/tournament/tournament.server";
import { getOrCreateUser } from "@/lib/clerk";

export async function ScheduleHeader({ slug }: { slug: string }) {
    const user = await getOrCreateUser();
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            members: true,
            games: true
        }
    });

    if (!tournament) return null;

    const isManager = tournament.members.some(m => m.userId === user?.id && m.role === "MANAGER");
    const canManage = tournament.ownerId === user?.id || isManager;

    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Calendar className="w-8 h-8 text-primary" /> Schedule
                </h1>
                <p className="text-muted-foreground">
                    Manage fixtures and match results.
                </p>
            </div>
            {canManage && tournament.games.length === 0 && (
                <form action={generateScheduleAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <Button type="submit">
                        <RefreshCw className="w-4 h-4 mr-2" /> Generate Schedule
                    </Button>
                </form>
            )}
        </div>
    );
}
