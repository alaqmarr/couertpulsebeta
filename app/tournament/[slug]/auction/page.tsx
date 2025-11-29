import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingCard } from "@/components/LoadingCard";
import { AuctionContent } from "./components/AuctionContent";

export default async function AuctionPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    // Minimal fetch for header/shell
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        select: { id: true } // Just checking existence
    });

    if (!tournament) notFound();

    return (
        <Suspense fallback={<LoadingCard title="Loading Auction Room..." />}>
            <AuctionContent slug={slug} />
        </Suspense>
    );
}
