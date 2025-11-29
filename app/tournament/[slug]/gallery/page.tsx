import { Suspense } from "react";
import { GalleryHeader } from "@/components/tournament/gallery/GalleryHeader";
import { GalleryGridWrapper } from "@/components/tournament/gallery/GalleryGridWrapper";
import { LoadingState } from "@/components/ui/loading-state";

export default async function TournamentGalleryPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    return (
        <div className="space-y-8">
            <Suspense fallback={<div className="h-20 animate-pulse bg-white/5 rounded-lg" />}>
                <GalleryHeader slug={slug} />
            </Suspense>

            <Suspense fallback={<LoadingState title="Loading Photos..." message="Fetching gallery images" />}>
                <GalleryGridWrapper slug={slug} />
            </Suspense>
        </div>
    );
}
