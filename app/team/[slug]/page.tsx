import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { LoadingCard } from "@/components/LoadingCard";
import { TeamHeader } from "@/components/team/TeamHeader";
import { TeamMembers } from "@/components/team/TeamMembers";
import { TeamSessions } from "@/components/team/TeamSessions";
import { TeamStats } from "@/components/team/TeamStats";
import { TeamSummary } from "@/components/team/TeamSummary";
import { TeamSidebarLeaderboard } from "@/components/team/TeamSidebarLeaderboard";
import { Info } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Always fresh SSR

export default async function TeamPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    return (
        <main className="min-h-screen text-foreground p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* ---------------- HEADER ---------------- */}
                <Suspense fallback={<LoadingCard title="Loading Team Details..." />}>
                    <TeamHeader slug={slug} />
                </Suspense>

                <Separator className="bg-white/10" />

                {/* ---------------- TWO COLUMN LAYOUT ---------------- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* ---------------- MAIN CONTENT (Left) ---------------- */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* ---------------- TEAM MEMBERS ---------------- */}
                        <Suspense fallback={<LoadingCard title="Loading Members..." />}>
                            <TeamMembers slug={slug} />
                        </Suspense>

                        {/* ---------------- SESSIONS ---------------- */}
                        <Suspense fallback={<LoadingCard title="Loading Sessions..." />}>
                            <TeamSessions slug={slug} />
                        </Suspense>

                        {/* ---------------- PLAYER PERFORMANCE GRID ---------------- */}
                        <Suspense fallback={<LoadingCard title="Calculating Stats..." />}>
                            <TeamStats slug={slug} />
                        </Suspense>
                    </div>

                    {/* ---------------- SIDEBAR (Right) ---------------- */}
                    <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-8">
                        {/* ---------------- TEAM LEADERBOARD ---------------- */}
                        <Suspense fallback={<LoadingCard title="Computing Team Stats..." />}>
                            <TeamSidebarLeaderboard slug={slug} />
                        </Suspense>


                        {/* ---------------- SUMMARY ---------------- */}
                        <Suspense fallback={<LoadingCard title="Loading Summary..." />}>
                            <TeamSummary slug={slug} />
                        </Suspense>
                    </aside>
                </div>
            </div>
        </main>
    );
}

// Helper components for a cleaner look
function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
            <Info size={24} className="text-primary" />
            <p className="text-muted-foreground text-sm text-center">{text}</p>
        </div>
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