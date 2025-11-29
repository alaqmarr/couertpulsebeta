import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPlayerOverallStats, getPlayerMatchHistory } from "@/lib/player-stats";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Trophy, Target, TrendingUp, Calendar, Lock } from "lucide-react";
import { checkProfileVisibility } from "@/lib/player-privacy"

export default async function PlayerProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const currentUser = await getOrCreateUser();

    const player = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            // isProfilePublic: true, // Removed
            points: true,
            createdAt: true,
        },
    });

    if (!player) notFound();

    // Check privacy using the new system
    const canView = await checkProfileVisibility(id, currentUser?.id);
    if (!canView.allowed) {
        // If not allowed, show a private profile message or redirect
        return (
            <div className="max-w-4xl mx-auto p-8 text-center">
                <Card className="glass-card p-12">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h1 className="text-2xl font-bold">Private Profile</h1>
                        <p className="text-muted-foreground">
                            This player's profile is set to private.
                        </p>
                        <Button asChild variant="outline" className="mt-4">
                            <Link href="/">Return Home</Link>
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const isOwner = currentUser?.id === player.id;
    const stats = await getPlayerOverallStats(id);
    const matchHistory = await getPlayerMatchHistory(id, 5);

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6">
            <Card className="glass-card">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-6">
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={player.image || undefined} />
                            <AvatarFallback className="text-2xl">
                                {player.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{player.name}</h1>
                                <Badge variant="outline">Points: {player.points}</Badge>
                            </div>

                            {player.bio && (
                                <p className="text-muted-foreground mb-4">{player.bio}</p>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Joined {formatDistanceToNow(player.createdAt, { addSuffix: true })}
                                </div>
                            </div>
                        </div>

                        {isOwner && (
                            <Link href="/settings" className="text-sm text-primary hover:underline">
                                Edit Profile
                            </Link>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass-panel">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalGames}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.tournamentGames} tournament • {stats.sessionGames} practice
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-panel">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Wins</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.totalWins}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalLosses} losses
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-panel">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.winRate}%</div>
                        <p className="text-xs text-muted-foreground">Overall performance</p>
                    </CardContent>
                </Card>

                <Card className="glass-panel">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Points Scored</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pointsScored}</div>
                        <p className="text-xs text-muted-foreground">Tournament points</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Recent Matches</CardTitle>
                </CardHeader>
                <CardContent>
                    {matchHistory.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No matches yet</p>
                    ) : (
                        <div className="space-y-3">
                            {matchHistory.map((match) => (
                                <Link
                                    key={match.id}
                                    href={`/tournament/${match.tournamentSlug}`}
                                    className="block p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{match.tournamentName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {match.teamA} vs {match.teamB}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-bold">
                                                {match.scoreA} - {match.scoreB}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {match.completedAt && formatDistanceToNow(match.completedAt, { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Performance Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total Matches</span>
                                <span className="font-bold">{stats.totalGames}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Tournaments</span>
                                <span className="font-bold">{stats.tournamentGames}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Practice Games</span>
                                <span className="font-bold">{stats.sessionGames}</span>
                            </div>
                            <div className="h-px bg-border my-3" />
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Win/Loss Ratio</span>
                                <span className="font-bold">
                                    {stats.totalWins}/{stats.totalLosses}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            Achievements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-muted-foreground py-4">
                            Achievement system coming soon!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
