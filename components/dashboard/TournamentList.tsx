import { getOrCreateUser } from "@/lib/clerk";
import { getUserTournaments } from "@/lib/dashboard-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";

export default async function TournamentList() {
    const user = await getOrCreateUser();
    if (!user) return null;

    const tournaments = await getUserTournaments(user.id);

    if (tournaments.length === 0) return null;

    return (
        <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
                Your Tournaments
            </h2>
            <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
                {tournaments.map((t) => {
                    const isOwner = t.ownerId === user.id;
                    return (
                        <Card
                            key={t.id}
                            className="flex flex-col bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-border/50 transition-all duration-300 hover:border-border hover:shadow-lg"
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{t.name}</CardTitle>
                                    <span
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${t.isActive
                                                ? "bg-green-100/10 text-green-400 border-green-400/30"
                                                : "bg-gray-100/10 text-gray-400 border-gray-400/30"
                                            }`}
                                    >
                                        {t.isActive ? "Active" : "Completed"}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground pt-1">
                                    Created{" "}
                                    {formatInTimeZone(
                                        t.createdAt,
                                        "Asia/Kolkata",
                                        "d MMM yyyy"
                                    )}
                                </p>
                            </CardHeader>
                            <CardContent className="mt-auto pt-4">
                                <Button
                                    asChild
                                    variant={isOwner ? "default" : "secondary"}
                                    className="w-full"
                                >
                                    <Link href={`/tournament/${t.slug}`}>
                                        {isOwner ? "Manage Tournament" : "View Tournament"}
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

export function TournamentListSkeleton() {
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
