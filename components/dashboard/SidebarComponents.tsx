import { getOrCreateUser } from "@/lib/clerk";
import { getPlayerIntelData, getSessionInfoData, getAppDataFreshness } from "@/lib/dashboard-data";
import { UpcomingSessionCard } from "@/components/dashboard/UpcomingSessionCard";
import { PlayerIntelCard } from "@/components/dashboard/PlayerIntelCard";
import { DataFreshnessAlert } from "@/components/dashboard/DataFreshnessAlert";

export async function UpcomingSession() {
    const user = await getOrCreateUser();
    if (!user) return null;

    const sessionInfo = await getSessionInfoData(user.id, user.email);
    return <UpcomingSessionCard sessionInfo={sessionInfo} />;
}

export async function PlayerIntel() {
    const user = await getOrCreateUser();
    if (!user) return null;

    const facts = await getPlayerIntelData(user.id, user.email, user.name);
    return <PlayerIntelCard facts={facts} />;
}

export async function DataFreshness() {
    const user = await getOrCreateUser();
    if (!user) return null;

    const { lastBuildTime, packageType } = await getAppDataFreshness(user.id);
    return <DataFreshnessAlert buildTime={lastBuildTime} packageType={packageType} />;
}

export function SidebarSkeleton() {
    return (
        <div className="space-y-8">
            <div className="h-48 rounded-xl bg-muted/20 animate-pulse" />
            <div className="h-64 rounded-xl bg-muted/20 animate-pulse" />
            <div className="h-24 rounded-xl bg-muted/20 animate-pulse" />
        </div>
    )
}
