import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, Shirt } from "lucide-react";
import { addTournamentPlayerAction, updatePlayerCustomStatsAction, createTournamentTeamAction } from "../../tournament.server";
import { FormImageUpload } from "@/components/ui/form-image-upload";

export default async function TournamentTeamsPage({
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
            players: {
                include: { user: true }
            },
            tournamentTeams: {
                include: { players: true }
            }
        }
    });

    if (!tournament) notFound();

    const unsoldPlayers = tournament.players.filter(p => !p.teamId);
    const soldPlayers = tournament.players.filter(p => p.teamId);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Teams & Players</h1>
                    <p className="text-muted-foreground">Manage the player pool and team rosters.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* TEAM MANAGEMENT */}
                <div className="md:col-span-1 space-y-4">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Shirt className="w-5 h-5 text-primary" /> Create Team
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={createTournamentTeamAction} className="space-y-4">
                                <input type="hidden" name="slug" value={slug} />
                                <div className="space-y-2">
                                    <Label htmlFor="name">Team Name</Label>
                                    <Input id="name" name="name" placeholder="e.g. Thunderbolts" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="color">Team Color</Label>
                                    <div className="flex gap-2">
                                        <Input id="color" name="color" type="color" className="w-12 h-10 p-1" defaultValue="#3b82f6" />
                                        <Input name="colorHex" placeholder="#3b82f6" className="flex-1" readOnly />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Team Logo</Label>
                                    <FormImageUpload
                                        name="logoUrl"
                                        defaultValue=""
                                    />
                                </div>
                                <Button type="submit" className="w-full">Create Team</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* PLAYER POOL & ROSTERS */}
                < div className="md:col-span-2 space-y-4" >
                    <Card className="glass-card h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="w-5 h-5 text-primary" />
                                Player Pool ({unsoldPlayers.length})
                            </CardTitle>
                        </CardHeader>
                        {/* Unsold Players List */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Unsold Players</h3>
                            {unsoldPlayers.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {unsoldPlayers.map(player => (
                                        <Card key={player.id} className="p-3 flex items-center justify-between text-sm">
                                            <span>{player.name}</span>
                                            <Button variant="ghost" size="sm">Sell</Button>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">All players have been sold or no players added yet.</p>
                            )}
                        </div>

                        {/* Team Rosters */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Team Rosters</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {tournament.tournamentTeams.map(tt => (
                                    <Card key={tt.id} className="glass-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="flex items-center justify-between text-base">
                                                <span className="flex items-center gap-2">
                                                    <Shirt className="w-4 h-4 text-primary" />
                                                    {tt.name}
                                                </span>
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    {tt.purseSpent} / {tournament.auctionPurse} pts
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {tournament.players
                                                    .filter(p => p.teamId === tt.id)
                                                    .map(p => (
                                                        <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded bg-white/5">
                                                            <span>{p.name}</span>
                                                            <span className="font-mono text-xs text-primary">{p.soldPrice} pts</span>
                                                        </div>
                                                    ))}
                                                {tournament.players.filter(p => p.teamId === tt.id).length === 0 && (
                                                    <p className="text-xs text-muted-foreground italic">No players yet.</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {tournament.tournamentTeams.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-12 col-span-2 border-2 border-dashed rounded-xl">
                                        No teams registered yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
