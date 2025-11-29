import { analyticsDb } from "@/lib/analytics-db";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { format, subDays } from "date-fns";

export async function AdvancedMetricsWrapper() {
    // Fetch ELO history
    const eloHistory = await analyticsDb.eloHistory.findMany({
        take: 50,
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true, rating: true }
    });

    const formattedEloHistory = eloHistory.map(h => ({
        date: format(h.timestamp, 'MM/dd'),
        rating: h.rating
    }));

    // Fetch Activity Data (last 7 days)
    const sevenDaysAgo = subDays(new Date(), 7);
    // Mock activity data for now as we don't have real activity tracking yet
    const formattedActivityData = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        return {
            date: format(d, 'MM/dd'),
            count: Math.floor(Math.random() * 20) + 5
        };
    });

    return (
        <AnalyticsDashboard
            eloHistory={formattedEloHistory}
            activityData={formattedActivityData}
        />
    );
}
