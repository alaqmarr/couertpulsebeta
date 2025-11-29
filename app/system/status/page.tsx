import { getSystemStatus } from "@/lib/system-status";
import { DatabaseStatusCard } from "@/components/system/DatabaseStatusCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/clerk";

export const revalidate = 0; // Don't cache

export default async function SystemStatusPage() {
    const user = await getOrCreateUser();

    // Only allow admin/manager access (you can customize this)
    if (!user) {
        redirect("/login");
    }

    const statuses = await getSystemStatus();

    const allHealthy = statuses.every((s) => s.status === "healthy");
    const anyDown = statuses.some((s) => s.status === "down");

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold">System Status</h1>
                    <p className="text-muted-foreground">
                        Database health and performance monitoring
                    </p>
                </div>
                <form>
                    <Button type="submit" variant="outline" size="icon">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </form>
            </div>

            {allHealthy && (
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-green-800 dark:text-green-200 font-medium">
                        ✅ All systems operational
                    </p>
                </div>
            )}

            {anyDown && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-red-800 dark:text-red-200 font-medium">
                        ⚠️ Some systems are experiencing issues
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {statuses.map((status) => (
                    <DatabaseStatusCard key={status.name} status={status} />
                ))}
            </div>

            <div className="text-xs text-muted-foreground text-center">
                Last checked: {new Date().toLocaleString()}
            </div>
        </div>
    );
}
