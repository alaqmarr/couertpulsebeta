import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Trophy, Activity } from "lucide-react";
import { TournamentProgressChart, TeamPerformanceChart } from "./analytics-charts";

export default async function AnalyticsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            games: {
                where: { status: "COMPLETED" },
                include: {
                    teamA: true,
                    teamB: true,
                }
            },
            tournamentTeams: {
                include: {
                    players: true
                }
            }
        }
    });

    if (!tournament) notFound();

    // --- Stats Calculation ---
    const totalGames = tournament.games.length;
    let totalRuns = 0;
    let highestScore = 0;
    const progressData: any[] = [];

    tournament.games.forEach((game, index) => {
        const matchTotal = (game.teamAScore || 0) + (game.teamBScore || 0);
        totalRuns += matchTotal;
        highestScore = Math.max(highestScore, game.teamAScore || 0, game.teamBScore || 0);

        progressData.push({
            name: `M${index + 1}`,
            totalPoints: matchTotal,
        });
    });

    const avgScore = totalGames > 0 ? Math.round(totalRuns / (totalGames * 2)) : 0; // Avg per inning approx

    const teamPerformanceData = tournament.tournamentTeams.map(team => ({
        name: team.name,
        wins: team.wins,
        losses: team.losses,
    }));

    // Sort teams by wins for the chart
    teamPerformanceData.sort((a, b) => b.wins - a.wins);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-8 h-8 text-primary" /> Analytics & Insights
                </h1>
                <p className="text-muted-foreground">
                    Deep dive into tournament performance and team statistics.
                </p>
            </div>

            <Tabs defaultValue="tournament" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="tournament">Tournament Overview</TabsTrigger>
                    <TabsTrigger value="teams">Team Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="tournament" className="space-y-6">
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
                </TabsContent>

                <TabsContent value="teams" className="space-y-6">
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

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Team Details</CardTitle>
                            <CardDescription>Detailed stats for each team.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {tournament.tournamentTeams.map(team => (
                                    <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg bg-secondary/10">
                                        <div className="flex items-center gap-3">
                                            {team.logoUrl ? (
                                                <img src={team.logoUrl} alt={team.name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                                                    {team.name[0]}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold">{team.name}</p>
                                                <p className="text-xs text-muted-foreground">{team.players.length} Players</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex gap-4">
                                            <div>
                                                <p className="font-bold text-green-500">{team.wins} Wins</p>
                                                <p className="text-xs text-muted-foreground">{team.matchesPlayed} Matches</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-primary">{team.points} Pts</p>
                                                <p className="text-xs text-muted-foreground">Net Run Rate (N/A)</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
