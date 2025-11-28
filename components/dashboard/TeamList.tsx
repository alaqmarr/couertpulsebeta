import { getOrCreateUser } from "@/lib/clerk";
import { getUserTeams } from "@/lib/dashboard-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import Link from "next/link";
import { getWinRateColorClass } from "@/lib/utility-functions";

export default async function TeamList() {
    const user = await getOrCreateUser();
    if (!user) return null;

    const teams = await getUserTeams(user.id, user.email);

    if (teams.length === 0) return null;

    return (
        <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
                Your Teams
            </h2>
            <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
                {teams.map((t) => {
                    const isOwner = t.ownerId === user.id;
                    return (
                        <Card
                            key={t.id}
                            className="flex flex-col bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-border/50 transition-all duration-300 hover:border-border hover:shadow-lg"
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{t.name}</CardTitle>
                                    <span className="text-xs font-medium text-muted-foreground bg-muted/80 px-2 py-1 rounded-md flex items-center gap-1.5 border border-border/50">
                                        <Users size={14} />
                                        {t.members.length} members
                                    </span>
                                </div>
                                {t.stats.plays > 0 && (
                                    <p className="text-sm text-muted-foreground pt-1 flex items-center gap-1">
                                        {t.stats.plays} games ·{" "}
                                        <span
                                            className={getWinRateColorClass(
                                                parseFloat(t.stats.winRate)
                                            )}
                                        >
                                            {t.stats.wins} wins
                                        </span>
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-col gap-2 mt-auto pt-4">
                                <Button
                                    asChild
                                    variant={isOwner ? "default" : "outline"}
                                    className="w-full"
                                >
                                    <Link href={`/team/${t.slug}`}>
                                        {isOwner ? "Manage Team" : "View Team"}
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="secondary"
                                    className="w-full"
                                >
                                    <Link href={`/team/${t.slug}/stats`}>
                                        View Stats
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}

export function TeamListSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-8 w-48 bg-muted/20 rounded animate-pulse" />
            <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse" />
                ))}
            </div>
        </div>
    );
}
