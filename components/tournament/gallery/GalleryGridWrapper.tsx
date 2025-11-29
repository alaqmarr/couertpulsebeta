import { prisma } from "@/lib/db";
import { GalleryGrid } from "@/components/tournament/GalleryGrid";

export async function GalleryGridWrapper({ slug }: { slug: string }) {
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        select: { galleryImages: true }
    });

    if (!tournament) return null;

    return <GalleryGrid images={tournament.galleryImages} />;
}
