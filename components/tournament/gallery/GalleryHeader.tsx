import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { GalleryUpload } from "@/components/tournament/GalleryUpload";
import { ImageIcon } from "lucide-react";

export async function GalleryHeader({ slug }: { slug: string }) {
    const user = await getOrCreateUser();
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            members: true,
        },
    });

    if (!tournament) return null;

    const isOwner = user ? tournament.ownerId === user.id : false;
    const isManager = user
        ? tournament.members.some(
            (m) => m.userId === user.id && (m.role === "MANAGER" || m.role === "CO_OWNER")
        )
        : false;
    const canUpload = isOwner || isManager;

    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <ImageIcon className="w-8 h-8 text-primary" /> Photo Gallery
                </h1>
                <p className="text-muted-foreground">
                    Highlights and moments from the tournament.
                </p>
            </div>
            {canUpload && (
                <GalleryUpload tournamentId={tournament.id} slug={slug} />
            )}
        </div>
    );
}
