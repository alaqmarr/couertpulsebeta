import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Trophy,
    Gavel,
    Calendar,
    Settings,
    Users,
    LayoutDashboard,
    Link as LinkIcon
} from "lucide-react";

import { TournamentSidebar } from "./tournament-sidebar";

export default async function TournamentLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            members: {
                where: { userId: user.id }
            }
        }
    });

    if (!tournament) notFound();

    const userRole = tournament.members[0]?.role;
    const isManager = userRole === "MANAGER" || tournament.ownerId === user.id;

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            <TournamentSidebar
                slug={slug}
                tournamentName={tournament.name}
                isManager={isManager}
            />

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
