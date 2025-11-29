import { prisma } from "@/lib/db";
import { Info } from "lucide-react";

export async function TeamSummary({ slug }: { slug: string }) {
    const team = await prisma.team.findUnique({
        where: { slug },
        include: {
            sessions: {
                include: { games: true }
            },
            members: true
        }
    });

    if (!team) return null;

    return (
        <section>
            <div className="glass-card rounded-xl border-primary/10">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-lg">
                        <Info size={18} className="text-primary" />
                        Team Summary
                    </div>
                    <div className="space-y-2">
                        <SummaryItem
                            label="Games Played"
                            value={team.sessions.reduce((a, s) => a + s.games.length, 0)}
                        />
                        <SummaryItem label="Total Sessions" value={team.sessions.length} />
                        <SummaryItem label="Total Members" value={team.members.length} />
                    </div>
                </div>
            </div>
        </section>
    );
}

function SummaryItem({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex justify-between items-center text-sm p-2 bg-black/20 rounded border border-white/5">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground">{value}</span>
        </div>
    );
}
