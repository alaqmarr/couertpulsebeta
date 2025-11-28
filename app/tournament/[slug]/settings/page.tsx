import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, UserPlus, Save, Shield } from "lucide-react";
import { updateTournamentSettingsAction, addTournamentMemberAction } from "../../tournament.server";
import { FormImageUpload } from "@/components/ui/form-image-upload";

export default async function SettingsPage({
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
            members: {
                include: { user: true }
            }
        }
    });

    if (!tournament) notFound();

    // Verify Manager Access
    const currentUserMember = tournament.members.find(m => m.userId === user.id);
    const isOwner = tournament.ownerId === user.id;
    const isManager = currentUserMember?.role === "MANAGER";

    if (!isManager && !isOwner) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <Shield className="w-12 h-12 text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Settings className="w-8 h-8 text-primary" /> Tournament Settings
                    </h1>
                    <p className="text-muted-foreground">Manage tournament configuration and access.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <a href={`/tournament/${slug}/setup`}>Setup & Rules</a>
                    </Button>
                    <Button asChild variant="outline">
                        <a href={`/tournament/${slug}/enrollments`}>Manage Enrollments</a>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                        <a href={`/tournament/${slug}/export`} download>
                            <Save className="w-4 h-4" /> Export Data
                        </a>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: GENERAL SETTINGS */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                            <CardDescription>Update basic tournament details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={updateTournamentSettingsAction} className="space-y-4">
                                <input type="hidden" name="slug" value={slug} />

                                <div className="space-y-2">
                                    <Label htmlFor="name">Tournament Name</Label>
                                    <Input id="name" name="name" defaultValue={tournament.name} required />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tournament Thumbnail</Label>
                                    <p className="text-xs text-muted-foreground mb-2">Upload a thumbnail image for your tournament.</p>
                                    <FormImageUpload
                                        name="thumbnailUrl"
                                        defaultValue={tournament.thumbnailUrl ?? undefined}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="auctionPurse">Auction Purse</Label>
                                        <Input
                                            id="auctionPurse"
                                            name="auctionPurse"
                                            type="number"
                                            defaultValue={tournament.auctionPurse}
                                            min="1000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="courts">Number of Courts</Label>
                                        <Input
                                            id="courts"
                                            name="courts"
                                            type="number"
                                            defaultValue={tournament.courts}
                                            min="1"
                                            max="10"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full">
                                    <Save className="w-4 h-4 mr-2" /> Save Changes
                                </Button>
                            </form>

                            {(tournament.paymentUpi || tournament.paymentQrCode) && (
                                <div className="mt-6 pt-6 border-t border-border">
                                    <h3 className="font-semibold mb-4">Payment QR Code Preview</h3>
                                    <div className="flex flex-col md:flex-row gap-4 items-start bg-secondary/20 p-4 rounded-lg">
                                        <div className="w-32 h-32 relative bg-white p-2 rounded-md shrink-0 border border-border">
                                            <img
                                                src={
                                                    tournament.paymentUpi
                                                        ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                                            `upi://pay?pa=${tournament.paymentUpi}&pn=${tournament.name}&am=${tournament.entryFee}&tn=Payment for ${tournament.name} Entry&cu=INR`
                                                        )}`
                                                        : tournament.paymentQrCode ?? undefined
                                                }
                                                alt="Payment QR Code"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <p className="font-medium">This is what users will see during enrollment.</p>
                                            {tournament.paymentUpi && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-muted-foreground">UPI ID:</span>
                                                    <code className="bg-background px-2 py-1 rounded border font-mono select-all">
                                                        {tournament.paymentUpi}
                                                    </code>
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-2">
                                                If you provided a UPI ID, this QR is auto-generated. Otherwise, it uses your custom upload.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: MEMBER MANAGEMENT */}
                <div className="space-y-6">
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
                                    {tournament.members.map((member) => (
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
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
