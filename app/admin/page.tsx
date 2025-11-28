import { getOrCreateUser } from "@/lib/clerk";
import { redirect } from "next/navigation";
import adminEmails from "@/config/admins.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Users, Trophy, Activity } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const user = await getOrCreateUser();

    if (!user || !user.email) {
        redirect("/sign-in");
    }

    // Check if user is admin
    if (!adminEmails.includes(user.email)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
                <ShieldAlert size={64} className="text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        );
    }

    // Fetch Overview Data
    const [userCount, teamCount, tournamentCount, gameCount] = await Promise.all([
        prisma.user.count(),
        prisma.team.count(),
        prisma.tournament.count(),
        prisma.game.count(),
    ]);

    return (
        <main className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">System overview and management.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{teamCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{tournamentCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{gameCount}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Placeholder for more admin features */}
                <div className="p-8 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                    More admin tools coming soon...
                </div>
            </div>
        </main>
    );
}
