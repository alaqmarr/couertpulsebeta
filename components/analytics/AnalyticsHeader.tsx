import { BarChart3 } from "lucide-react";

export function AnalyticsHeader() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-primary" /> Analytics & Insights
            </h1>
            <p className="text-muted-foreground">
                Deep dive into tournament performance and team statistics.
            </p>
        </div>
    );
}
