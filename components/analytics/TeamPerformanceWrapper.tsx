import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TeamPerformanceChart } from "@/app/tournament/[slug]/analytics/analytics-charts";

export async function TeamPerformanceWrapper({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            tournamentTeams: true
        }
    });

    if (!tournament) return null;

    const teamPerformanceData = tournament.tournamentTeams.map(team => ({
        name: team.name,
        wins: team.wins,
        losses: team.losses,
    }));

    teamPerformanceData.sort((a, b) => b.wins - a.wins);

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card col-span-2">
                <CardHeader>
                    <CardTitle>Team Performance</CardTitle>
                    <CardDescription>Win/Loss comparison across all teams.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <TeamPerformanceChart data={teamPerformanceData} />
                </CardContent>
            </Card>
        </div>
    );
}
