import { prisma } from "@/lib/db";
import { getTeamLeaderboard } from "@/lib/leaderboard";
import { BarChartHorizontal, Info } from "lucide-react";
import PlayerStatsCard from "@/app/team/[slug]/components/PlayerStatsCard";

export async function TeamStats({ slug }: { slug: string }) {
    const team = await prisma.team.findUnique({
        where: { slug },
        select: { id: true }
    });

    if (!team) return null;

    let leaderboard = await getTeamLeaderboard(team.id);

    leaderboard = leaderboard.sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return a.name.localeCompare(b.name);
    });

    return (
        <section>
            <div className="glass-card rounded-xl border-primary/10">
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-2 font-semibold text-lg">
                        <BarChartHorizontal size={18} className="text-primary" />
                        Individual Player Performance
                    </div>
                    <div>
                        {leaderboard.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
                                <Info size={24} className="text-primary" />
                                <p className="text-muted-foreground text-sm text-center">No games yet to calculate player stats.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {leaderboard.map((player: any) => (
                                    <PlayerStatsCard key={player.id} player={player} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
