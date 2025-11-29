import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingCard } from "@/components/LoadingCard";
import { EnrollmentsContent } from "./components/EnrollmentsContent";

export default async function AdminEnrollmentsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    // Minimal fetch for header
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        select: { name: true }
    });

    if (!tournament) notFound();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Enrollment Requests</h1>
                    <p className="text-muted-foreground">Manage and approve player registrations.</p>
                </div>
            </div>

            <Suspense fallback={<LoadingCard title="Loading Enrollments..." />}>
                <EnrollmentsContent slug={slug} />
            </Suspense>
        </div>
    );
}
