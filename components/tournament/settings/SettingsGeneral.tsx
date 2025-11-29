import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { updateTournamentSettingsAction } from "@/app/tournament/tournament.server";
import { FormImageUpload } from "@/components/ui/form-image-upload";

export async function SettingsGeneral({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
    });

    if (!tournament) return null;

    return (
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

                    <div className="space-y-2">
                        <Label>Tournament Banner</Label>
                        <p className="text-xs text-muted-foreground mb-2">Upload a banner image for your tournament page.</p>
                        <FormImageUpload
                            name="bannerUrl"
                            defaultValue={tournament.bannerUrl ?? undefined}
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
    );
}
