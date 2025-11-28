import { getOrCreateUser } from "@/lib/clerk";
import { getUserStats } from "@/lib/dashboard-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, CheckCircle2, XCircle, LineChart } from "lucide-react";
import { getWinRateColorClass } from "@/lib/utility-functions";

export default async function UserStats() {
    const user = await getOrCreateUser();
    if (!user) return null;

    const stats = await getUserStats(user.id, user.email, user.name);
    const { totalPoints, totalWins, totalLosses, winRate } = stats;

    return (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
                title="Total Points"
                value={totalPoints}
                icon={Star}
                accentColor="text-yellow-400"
            />
            <StatCard
                title="Total Wins"
                value={totalWins}
                icon={CheckCircle2}
                accentColor="text-primary"
            />
            <StatCard
                title="Total Losses"
                value={totalLosses}
                icon={XCircle}
                accentColor="text-destructive"
            />
            <StatCard
                title="Win Rate"
                value={`${winRate}%`}
                icon={LineChart}
                accentColor={getWinRateColorClass(parseFloat(winRate))}
            />
        </section>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    accentColor,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    accentColor: string;
}) {
    return (
        <Card
            className={`relative overflow-hidden bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-border/50 group transition-all duration-300 hover:border-border/80 hover:shadow-lg hover:shadow-black/5 ${accentColor}`}
        >
            <Icon className="absolute -right-4 -bottom-4 h-24 w-24 text-current opacity-5 group-hover:opacity-10 transition-all duration-300" />
            <div className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] bg-gradient-radial from-current to-transparent opacity-0 group-hover:opacity-[0.03] transition-all duration-500" />
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold text-foreground">{value}</div>
            </CardContent>
        </Card>
    );
}

export function UserStatsSkeleton() {
    return (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-muted/20 animate-pulse" />
            ))}
        </section>
    );
}
