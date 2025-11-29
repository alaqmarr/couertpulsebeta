import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TournamentProgressChart } from "@/app/tournament/[slug]/analytics/analytics-charts";

export async function AnalyticsChartsWrapper({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            games: {
                where: { status: "COMPLETED" },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!tournament) return null;

    const progressData: any[] = [];

    tournament.games.forEach((game, index) => {
        const matchTotal = (game.teamAScore || 0) + (game.teamBScore || 0);
        progressData.push({
            name: `M${index + 1}`,
            totalPoints: matchTotal,
        });
    });

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card col-span-2">
                <CardHeader>
                    <CardTitle>Tournament Progress</CardTitle>
                    <CardDescription>Total points scored per match over time.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <TournamentProgressChart data={progressData} />
                </CardContent>
            </Card>
        </div>
    );
}
