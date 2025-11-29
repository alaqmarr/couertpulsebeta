import { Suspense } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { RecentTournaments } from "@/components/profile/RecentTournaments";
import { LoadingState } from "@/components/ui/loading-state";

export default function ProfilePage() {
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            {/* Profile Header */}
            <Suspense fallback={<LoadingState title="Loading Profile..." message="Fetching user details" />}>
                <ProfileHeader />
            </Suspense>

            {/* Stats Grid */}
            <Suspense fallback={<LoadingState title="Crunching Numbers..." message="Calculating your stats" />}>
                <ProfileStats />
            </Suspense>

            {/* Recent Tournaments */}
            <Suspense fallback={<LoadingState title="Loading History..." message="Fetching tournament records" />}>
                <RecentTournaments />
            </Suspense>
        </div>
    );
}
