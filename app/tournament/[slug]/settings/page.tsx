import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings, Save, Shield } from "lucide-react";
import { Suspense } from "react";
import { SettingsGeneral } from "@/components/tournament/settings/SettingsGeneral";
import { SettingsMembers } from "@/components/tournament/settings/SettingsMembers";
import { LoadingState } from "@/components/ui/loading-state";

export default async function SettingsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    // Lightweight check for permissions
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        select: {
            ownerId: true,
            members: {
                where: { userId: user.id },
                select: { role: true }
            }
        }
    });

    if (!tournament) notFound();

    const isOwner = tournament.ownerId === user.id;
    const isManager = tournament.members[0]?.role === "MANAGER";

    if (!isManager && !isOwner) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <Shield className="w-12 h-12 text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Settings className="w-8 h-8 text-primary" /> Tournament Settings
                    </h1>
                    <p className="text-muted-foreground">Manage tournament configuration and access.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <a href={`/tournament/${slug}/setup`}>Setup & Rules</a>
                    </Button>
                    <Button asChild variant="outline">
                        <a href={`/tournament/${slug}/enrollments`}>Manage Enrollments</a>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                        <a href={`/tournament/${slug}/export`} download>
                            <Save className="w-4 h-4" /> Export Data
                        </a>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: GENERAL SETTINGS */}
                <div className="lg:col-span-2 space-y-6">
                    <Suspense fallback={<LoadingState title="Loading Settings..." message="Fetching configuration" />}>
                        <SettingsGeneral slug={slug} />
                    </Suspense>
                </div>

                {/* RIGHT COLUMN: MEMBER MANAGEMENT */}
                <div className="space-y-6">
                    <Suspense fallback={<div className="h-64 animate-pulse bg-white/5 rounded-lg" />}>
                        <SettingsMembers slug={slug} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
