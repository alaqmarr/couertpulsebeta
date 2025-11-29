import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { LoadingCard } from "@/components/LoadingCard";
import { CheckInContent } from "./components/CheckInContent";

export default async function TournamentCheckInPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();

    if (!user) {
        redirect(`/sign-in?redirect=/tournament/${slug}/check-in`);
    }

    // Minimal fetch for header
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        select: { name: true }
    });

    if (!tournament) notFound();

    return (
        <div className="container max-w-md mx-auto py-10 px-4">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold">{tournament.name}</h1>
                <p className="text-muted-foreground">Player Check-in</p>
            </div>

            <Suspense fallback={<LoadingCard title="Loading Scanner..." />}>
                <CheckInContent slug={slug} />
            </Suspense>
        </div>
    );
}
