import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Users2 } from "lucide-react";

/**
 * Helper function to determine Tailwind color class based on win rate.
 */
function getWinRateColorClass(winRate: number): string {
    if (winRate < 20) return "text-red-500";
    if (winRate < 40) return "text-red-400";
    if (winRate < 50) return "text-yellow-500";
    if (winRate < 60) return "text-yellow-400";
    if (winRate < 80) return "text-green-400";
    return "text-green-500";
}

async function getNamefromDb(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return email;
    if (!user.name && !user?.displayName) {
        const name = await prisma.teamMember.findFirst({
            where: { email: email },
            select: { displayName: true }
        });
        return name?.displayName || email;
    }

    return user?.name || user?.displayName || email;
}

export async function TeamPairStats({ teamId }: { teamId: string }) {
    const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
            pairStats: true,
        },
    });

    if (!team) return null;

    return (
        <section className="glass-panel p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Users2 size={22} />
                Best Pairs
            </h2>
            {team.pairStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/5">
                    <Info size={24} className="text-primary" />
                    <p className="text-muted-foreground text-sm text-center">No pair statistics available yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {team.pairStats
                        .sort((a, b) => b.wins - a.wins)
                        .slice(0, 6)
                        .map(async (pair) => {
                            const winRate =
                                pair.plays > 0
                                    ? (pair.wins / pair.plays) * 100
                                    : 0;
                            const winRateColor = getWinRateColorClass(winRate);

                            return (
                                <div
                                    key={pair.id}
                                    className="glass-card rounded-xl border-primary/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
                                >
                                    <div className="p-6">
                                        <div className="text-lg font-semibold mb-2">
                                            {await getNamefromDb(pair.playerA)} & {await getNamefromDb(pair.playerB)}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm">
                                                <p className="font-medium text-foreground">
                                                    {pair.wins} Wins
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {pair.plays} Matches
                                                </p>
                                            </div>
                                            <div
                                                className={cn(
                                                    "text-2xl font-bold text-right",
                                                    winRateColor
                                                )}
                                            >
                                                {winRate.toFixed(0)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}
        </section>
    );
}
