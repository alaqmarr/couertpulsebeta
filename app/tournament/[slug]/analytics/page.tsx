import { getOrCreateUser } from "@/lib/clerk";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { AnalyticsOverview } from "@/components/analytics/AnalyticsOverview";
import { AnalyticsChartsWrapper } from "@/components/analytics/AnalyticsChartsWrapper";
import { AdvancedMetricsWrapper } from "@/components/analytics/AdvancedMetricsWrapper";
import { TeamPerformanceWrapper } from "@/components/analytics/TeamPerformanceWrapper";
import { TeamDetailsList } from "@/components/analytics/TeamDetailsList";
import { LoadingState } from "@/components/ui/loading-state";

export default async function AnalyticsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const user = await getOrCreateUser();
    if (!user) redirect("/sign-in");

    return (
        <div className="space-y-8">
            <AnalyticsHeader />

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced Metrics</TabsTrigger>
                    <TabsTrigger value="teams">Team Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 h-32 animate-pulse bg-white/5 rounded-lg" />}>
                        <AnalyticsOverview slug={slug} />
                    </Suspense>

                    <Suspense fallback={<LoadingState title="Loading Charts..." message="Visualizing tournament progress" />}>
                        <AnalyticsChartsWrapper slug={slug} />
                    </Suspense>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                    <Suspense fallback={<LoadingState title="Crunching Numbers..." message="Calculating advanced metrics" />}>
                        <AdvancedMetricsWrapper />
                    </Suspense>
                </TabsContent>

                <TabsContent value="teams" className="space-y-6">
                    <Suspense fallback={<LoadingState title="Analyzing Teams..." message="Comparing performance stats" />}>
                        <TeamPerformanceWrapper slug={slug} />
                    </Suspense>

                    <Suspense fallback={<div className="h-64 animate-pulse bg-white/5 rounded-lg" />}>
                        <TeamDetailsList slug={slug} />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
