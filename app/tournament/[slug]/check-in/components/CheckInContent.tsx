import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckInScanner } from "../check-in-scanner";

export async function CheckInContent({ slug }: { slug: string }) {
    const user = await getOrCreateUser();
    if (!user) return null; // Should be handled by parent or middleware, but safe guard

    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            members: {
                where: { userId: user.id },
            },
        },
    });

    if (!tournament) return null;

    // Check permissions (Owner or Manager)
    const isOwner = tournament.ownerId === user.id;
    const isManager = tournament.members.some(
        (m) => m.role === "MANAGER" || m.role === "CO_OWNER"
    );

    if (!isOwner && !isManager) {
        return (
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Access Denied</CardTitle>
                    <CardDescription>
                        You do not have permission to perform check-ins for this tournament.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return <CheckInScanner tournamentId={tournament.id} />;
}
