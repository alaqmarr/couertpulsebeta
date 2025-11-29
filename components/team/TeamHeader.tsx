import { prisma } from "@/lib/db";
import { Shield } from "lucide-react";
import ShareSpectatorLink from "@/components/ShareSpectatorLink";
import AddMemberDrawer from "@/app/team/[slug]/components/AddMemberDrawer";
import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/lib/clerk";

export async function TeamHeader({ slug }: { slug: string }) {
    const user = await getOrCreateUser();
    const team = await prisma.team.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            createdAt: true,
            ownerId: true
        }
    });

    if (!team) notFound();

    const isOwner = user ? team.ownerId === user.id : false;

    return (
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Shield size={28} className="text-primary" />
                    {team.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 ml-10">
                    Created on {new Date(team.createdAt).toLocaleDateString("en-IN")}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <ShareSpectatorLink slug={slug} />
                {isOwner && <AddMemberDrawer slug={slug} />}
            </div>
        </section>
    );
}
