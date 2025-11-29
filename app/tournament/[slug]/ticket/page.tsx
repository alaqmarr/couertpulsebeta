import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeGenerator } from "@/components/qrcode-generator";
import { format } from "date-fns";
import { CheckCircle2, MapPin, Calendar, Clock } from "lucide-react";

export default async function TournamentTicketPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();

    if (!user) {
        redirect(`/sign-in?redirect=/tournament/${slug}/ticket`);
    }

    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            players: {
                where: { userId: user.id },
                include: { team: true },
            },
        },
    });

    if (!tournament) notFound();

    const player = tournament.players[0];

    if (!player) {
        return (
            <div className="container max-w-md mx-auto py-10">
                <Card>
                    <CardHeader>
                        <CardTitle>No Ticket Found</CardTitle>
                        <CardDescription>
                            You are not enrolled in this tournament.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // QR Code Value: tournamentId:userId
    const qrValue = `${tournament.id}:${user.id}`;

    return (
        <div className="container max-w-md mx-auto py-10 px-4">
            <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
                <div className="bg-primary/10 p-6 text-center border-b border-primary/10">
                    <h1 className="text-2xl font-bold text-primary mb-2">{tournament.name}</h1>
                    <Badge variant={player.isCheckedIn ? "default" : "secondary"} className="text-sm">
                        {player.isCheckedIn ? "Checked In" : "Not Checked In"}
                    </Badge>
                </div>

                <CardContent className="p-6 space-y-6">
                    <div className="flex justify-center py-4">
                        <QRCodeGenerator
                            value={qrValue}
                            size={200}
                            label="Scan to Check-in"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground">Player</span>
                            <span className="font-semibold">{player.name}</span>
                        </div>

                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground">Team</span>
                            <span className="font-semibold">{player.team?.name || "No Team"}</span>
                        </div>

                        {tournament.startDate && (
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-muted-foreground">Date</span>
                                <span className="font-semibold">
                                    {format(new Date(tournament.startDate), "PPP")}
                                </span>
                            </div>
                        )}

                        {player.isCheckedIn && player.checkInTime && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400">
                                <CheckCircle2 className="w-5 h-5" />
                                <div className="text-sm">
                                    <p className="font-semibold">Check-in Confirmed</p>
                                    <p>{format(new Date(player.checkInTime), "p")}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                        <p>Show this QR code to the organizer at the venue.</p>
                        <p className="mt-1">Ticket ID: {player.id.slice(-8).toUpperCase()}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
