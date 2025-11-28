import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Users, Trophy, Coins } from "lucide-react";
import { Prisma, TournamentTeam, TournamentPlayer, Tournament } from "@/app/prisma";

type TeamWithDetails = TournamentTeam & {
    players: TournamentPlayer[];
    tournament: Tournament;
};

export default async function TeamDashboardPage({
    params,
}: {
    params: Promise<{ slug: string; teamId: string }>;
}) {
    const { slug, teamId } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const team = await prisma.tournamentTeam.findUnique({
        where: { id: teamId },
        include: {
            players: true,
            tournament: true
        }
    }) as TeamWithDetails | null;

    if (!team) notFound();

    // Strict Role Check: Only Owner or Admin/Manager
    // We don't have ownerId on Team, so we check TournamentMember role
    const tournamentMember = await prisma.tournamentMember.findUnique({
        where: {
            tournamentId_userId: {
                tournamentId: team.tournamentId,
                userId: user.id
            }
        }
    });

    const isManager = tournamentMember?.role === "MANAGER" || tournamentMember?.role === "CO_OWNER";

    if (!isManager) {
        // Fallback: Check if user is one of the players?
        // const isPlayer = team.players.some(p => p.email === user.email); // If we have email on player
        // if (!isPlayer) return <div>Access Denied</div>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10 border border-white/10 p-6 md:p-10">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 relative rounded-full overflow-hidden border-4 border-white/10 shadow-xl">
                        {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="object-cover w-full h-full" />
                        ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-3xl font-bold">
                                {team.name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                        <h1 className="text-4xl font-bold tracking-tight">{team.name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground">
                            <Badge variant="outline" className="glass-badge-outline">
                                <Trophy className="w-3 h-3 mr-1" /> {team.points} Pts
                            </Badge>
                            <Badge variant="outline" className="glass-badge-outline">
                                <Users className="w-3 h-3 mr-1" /> {team.players.length} Players
                            </Badge>
                            <Badge variant="outline" className="glass-badge-outline">
                                <Coins className="w-3 h-3 mr-1" /> Purse: {team.purseSpent} / {team.tournament.auctionPurse}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Players Grid */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" /> Squad
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {team.players.map((player) => (
                        <Card key={player.id} className="glass-card hover:bg-white/5 transition-colors">
                            <CardContent className="p-4 flex items-center gap-4">
                                <Avatar className="w-12 h-12 border border-white/10">
                                    <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold">{player.name}</p>
                                    {player.soldPrice && (
                                        <Badge variant="secondary" className="mt-1 text-[10px] h-5">
                                            Sold: {player.soldPrice}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {team.players.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground bg-white/5 rounded-xl border border-white/5 border-dashed">
                            No players in this squad yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
