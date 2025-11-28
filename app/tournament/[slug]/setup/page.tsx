import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, Shield } from "lucide-react";
import { updateTournamentSetupAction } from "../../tournament.server";
import { FormImageUpload } from "@/components/ui/form-image-upload";

export default async function TournamentSetupPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: { members: true },
    });

    if (!tournament) notFound();

    // Verify Manager/Owner Access
    const currentUserMember = tournament.members.find(m => m.userId === user.id);
    const isOwner = tournament.ownerId === user.id;
    const isManager = currentUserMember?.role === "MANAGER" || currentUserMember?.role === "CO_OWNER";

    if (!isManager && !isOwner) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <Shield className="w-12 h-12 text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to configure this tournament.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Settings className="w-8 h-8 text-primary" /> Tournament Setup
                    </h1>
                    <p className="text-muted-foreground">Configure detailed rules, fees, and payment methods.</p>
                </div>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>These details will be visible to users during enrollment.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateTournamentSetupAction} className="space-y-6">
                        <input type="hidden" name="slug" value={slug} />

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe your tournament..."
                                defaultValue={tournament.description || ""}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rules">Rules & Regulations</Label>
                            <Textarea
                                id="rules"
                                name="rules"
                                placeholder="List the rules..."
                                defaultValue={tournament.rules || ""}
                                className="min-h-[150px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Contact Phone</Label>
                                <Input
                                    id="contactPhone"
                                    name="contactPhone"
                                    placeholder="+91 9876543210"
                                    defaultValue={tournament.contactPhone || ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="entryFee">Entry Fee (₹)</Label>
                                <Input
                                    id="entryFee"
                                    name="entryFee"
                                    type="number"
                                    min="0"
                                    defaultValue={tournament.entryFee}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold">Payment Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="paymentUpi">UPI ID</Label>
                                    <Input
                                        id="paymentUpi"
                                        name="paymentUpi"
                                        placeholder="username@upi"
                                        defaultValue={tournament.paymentUpi || ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Custom QR Code (Optional)</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Upload a custom QR code if you don't want to use the auto-generated one based on UPI ID.
                                    </p>
                                    <FormImageUpload
                                        name="paymentQrCode"
                                        defaultValue={tournament.paymentQrCode || ""}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cashContactName">Cash Contact Name</Label>
                                    <Input
                                        id="cashContactName"
                                        name="cashContactName"
                                        placeholder="Name of person collecting cash"
                                        defaultValue={tournament.cashContactName || ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cashContactNumber">Cash Contact Number</Label>
                                    <Input
                                        id="cashContactNumber"
                                        name="cashContactNumber"
                                        placeholder="Contact number for cash"
                                        defaultValue={tournament.cashContactNumber || ""}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full">
                            <Save className="w-4 h-4 mr-2" /> Save Configuration
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
