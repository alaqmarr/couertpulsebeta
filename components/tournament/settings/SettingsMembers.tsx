import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus } from "lucide-react";
import { addTournamentMemberAction } from "@/app/tournament/tournament.server";

export async function SettingsMembers({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            members: {
                include: { user: true }
            }
        }
    });

    if (!tournament) return null;

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" /> Members
                </CardTitle>
                <CardDescription>Manage staff and permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Add Member Form */}
                <form action={addTournamentMemberAction} className="space-y-3 p-3 rounded-lg bg-secondary/20 border border-border">
                    <h4 className="font-semibold text-sm">Add New Member</h4>
                    <input type="hidden" name="slug" value={slug} />
                    <div className="space-y-2">
                        <Input name="email" type="email" placeholder="User Email" required className="bg-background" />
                        <select
                            name="role"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="MANAGER">Manager</option>
                            <option value="CO_OWNER">Co-Owner</option>
                            <option value="AUCTIONEER">Auctioneer</option>
                            <option value="REFEREE">Referee</option>
                        </select>
                    </div>
                    <Button type="submit" size="sm" className="w-full">
                        <UserPlus className="w-4 h-4 mr-2" /> Add Member
                    </Button>
                </form>

                {/* Member List */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">Current Staff</h3>
                    <div className="space-y-2">
                        {tournament.members && tournament.members.length > 0 ? (
                            tournament.members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 rounded-md bg-white/5 border border-white/10 text-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                                            {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                                        </div>
                                        <div className="truncate">
                                            <p className="font-medium truncate">{member.user.name || "Unknown"}</p>
                                            <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="ml-2 shrink-0 text-[10px]">
                                        {member.role}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No members found.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
