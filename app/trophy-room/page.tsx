import { Suspense } from "react";
import { TrophyHeader } from "@/components/trophy-room/TrophyHeader";
import { TrophyStats } from "@/components/trophy-room/TrophyStats";
import { RecentAchievements } from "@/components/trophy-room/RecentAchievements";
import { AchievementProgress } from "@/components/trophy-room/AchievementProgress";
import { LoadingState } from "@/components/ui/loading-state";

export default function TrophyRoomPage() {
    return (
        <div className="container mx-auto py-8 space-y-6">
            <TrophyHeader />

            {/* Stats Overview */}
            <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-5 gap-4 h-32 animate-pulse bg-white/5 rounded-lg" />}>
                <TrophyStats />
            </Suspense>

            {/* Recent Achievements */}
            <Suspense fallback={<LoadingState title="Loading Trophies..." message="Polishing your awards" />}>
                <RecentAchievements />
            </Suspense>

            {/* Completion Progress */}
            <Suspense fallback={<div className="h-24 animate-pulse bg-white/5 rounded-lg" />}>
                <AchievementProgress />
            </Suspense>
        </div>
    );
}
