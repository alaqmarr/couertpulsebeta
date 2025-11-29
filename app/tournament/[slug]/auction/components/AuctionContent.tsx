import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Gavel, DollarSign, User, Trophy } from "lucide-react";
import { AuctionClient } from "../auction-client";
import { sellPlayerAction } from "../../../tournament.server";

export async function AuctionContent({ slug }: { slug: string }) {
    const user = await getOrCreateUser();
    if (!user) return null;

    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            players: true,
            tournamentTeams: {
                orderBy: { purseSpent: 'asc' } // Show teams with most money first (least spent)
            },
            members: true
        }
    });

    if (!tournament) return null;

    // Check permissions
    const isManager = tournament.members.some(m => m.userId === user.id && (m.role === "MANAGER" || m.role === "AUCTIONEER"));
    const canConductAuction = tournament.ownerId === user.id || isManager;

    const unsoldPlayers = tournament.players.filter(p => !p.teamId);
    const soldPlayers = tournament.players.filter(p => p.teamId);

    // Calculate remaining purse for each team
    const teamsWithPurse = tournament.tournamentTeams.map(tt => ({
        ...tt,
        remainingPurse: tournament.auctionPurse - tt.purseSpent
    }));

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Gavel className="w-8 h-8 text-primary" /> Auction Room
                    </h1>
                    <p className="text-muted-foreground">
                        Live auction dashboard. Total Purse: <span className="text-primary font-bold">{tournament.auctionPurse} pts</span>
                    </p>
                </div>
                {!canConductAuction && (
                    <Badge variant="secondary">Spectator Mode</Badge>
                )}
            </div>

            {/* Real-time Auction Client */}
            <AuctionClient tournamentId={tournament.id} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: AUCTION CONTROLS (Only for Managers) */}
                <div className="lg:col-span-2 space-y-6">
                    {canConductAuction && (
                        <Card className="glass-card border-primary/20">
                            <CardHeader>
                                <CardTitle>Conduct Sale</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form action={sellPlayerAction} className="space-y-4">
                                    <input type="hidden" name="slug" value={slug} />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Select Player</Label>
                                            <select name="playerId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                                                <option value="">-- Choose Player --</option>
                                                {unsoldPlayers.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} {tournament.useCustomStats && p.customRating ? `(Rating: ${p.customRating})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Winning Team</Label>
                                            <select name="teamId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                                                <option value="">-- Choose Team --</option>
                                                {teamsWithPurse.map(t => (
                                                    <option key={t.id} value={t.id} disabled={t.remainingPurse <= 0}>
                                                        {t.name} (Rem: {t.remainingPurse})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Sold Price (Points)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input name="price" type="number" min="0" className="pl-9" placeholder="0" required />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" size="lg">
                                        <Gavel className="w-4 h-4 mr-2" /> Confirm Sale
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* RECENT SALES / UNSOLD LIST */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-lg">Unsold Players ({unsoldPlayers.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {unsoldPlayers.map(p => (
                                    <div key={p.id} className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                                                <User className="w-3 h-3" />
                                            </div>
                                            <span className="truncate font-medium text-sm">{p.name}</span>
                                        </div>
                                        {tournament.useCustomStats && (
                                            <div className="text-xs text-muted-foreground pl-8">
                                                Rating: {p.customRating || 'N/A'}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {unsoldPlayers.length === 0 && <p className="text-muted-foreground col-span-full">All players sold!</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: TEAM STANDINGS */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" /> Team Purses
                    </h3>
                    <div className="space-y-3">
                        {teamsWithPurse.map(t => (
                            <Card key={t.id} className="glass-card overflow-hidden">
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold">{t.name}</h4>
                                        <Badge variant={t.remainingPurse < 1000 ? "destructive" : "secondary"}>
                                            {t.remainingPurse} left
                                        </Badge>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{ width: `${(t.purseSpent / tournament.auctionPurse) * 100}%` }}
                                        />
                                    </div>

                                    <div className="text-xs text-muted-foreground flex justify-between">
                                        <span>Spent: {t.purseSpent}</span>
                                        <span>Total: {tournament.auctionPurse}</span>
                                    </div>

                                    {/* Roster Preview */}
                                    <div className="pt-2 border-t border-white/5">
                                        <p className="text-xs font-semibold mb-1">Roster ({tournament.players.filter(p => p.teamId === t.id).length})</p>
                                        <div className="flex flex-wrap gap-1">
                                            {tournament.players
                                                .filter(p => p.teamId === t.id)
                                                .map(p => (
                                                    <span key={p.id} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 border border-white/5">
                                                        {p.name} ({p.soldPrice})
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
