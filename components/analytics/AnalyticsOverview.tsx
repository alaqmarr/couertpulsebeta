import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Trophy, Activity } from "lucide-react";

export async function AnalyticsOverview({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            games: {
                where: { status: "COMPLETED" },
            },
            tournamentTeams: true
        }
    });

    if (!tournament) return null;

    const totalGames = tournament.games.length;
    let totalRuns = 0;
    let highestScore = 0;

    tournament.games.forEach((game) => {
        const matchTotal = (game.teamAScore || 0) + (game.teamBScore || 0);
        totalRuns += matchTotal;
        highestScore = Math.max(highestScore, game.teamAScore || 0, game.teamBScore || 0);
    });

    const avgScore = totalGames > 0 ? Math.round(totalRuns / (totalGames * 2)) : 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalGames}</div>
                    <p className="text-xs text-muted-foreground">Completed games</p>
                </CardContent>
            </Card>
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{tournament.tournamentTeams.length}</div>
                    <p className="text-xs text-muted-foreground">Registered teams</p>
                </CardContent>
            </Card>
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{avgScore}</div>
                    <p className="text-xs text-muted-foreground">Avg. runs per inning</p>
                </CardContent>
            </Card>
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{highestScore}</div>
                    <p className="text-xs text-muted-foreground">In a single inning</p>
                </CardContent>
            </Card>
        </div>
    );
}
