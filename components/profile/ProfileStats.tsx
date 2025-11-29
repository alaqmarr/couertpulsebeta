import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Swords } from "lucide-react";

export async function ProfileStats() {
    const user = await getOrCreateUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            points: true,
            wins: true,
            losses: true,
            _count: {
                select: { tournamentPlayers: true }
            }
        }
    });

    if (!dbUser) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                    <Trophy className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dbUser.points}</div>
                    <p className="text-xs text-muted-foreground">Career points scored</p>
                </CardContent>
            </Card>
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {dbUser.wins + dbUser.losses > 0
                            ? Math.round((dbUser.wins / (dbUser.wins + dbUser.losses)) * 100)
                            : 0}
                        %
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {dbUser.wins}W - {dbUser.losses}L
                    </p>
                </CardContent>
            </Card>
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
                    <Swords className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dbUser._count.tournamentPlayers}</div>
                    <p className="text-xs text-muted-foreground">Participated</p>
                </CardContent>
            </Card>
        </div>
    );
}
