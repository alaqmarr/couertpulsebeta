import { Suspense } from "react";
import { getOrCreateUser } from "@/lib/clerk";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Swords, Package, Settings, AlertCircle } from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CreateEntityDialog from "@/components/CreateEntityDialog";

// Granular Components
import UserStats, { UserStatsSkeleton } from "@/components/dashboard/UserStats";
import TeamList, { TeamListSkeleton } from "@/components/dashboard/TeamList";
import TournamentList, { TournamentListSkeleton } from "@/components/dashboard/TournamentList";
import { UpcomingSession, PlayerIntel, DataFreshness } from "@/components/dashboard/SidebarComponents";
import { LoadingState } from "@/components/ui/loading-state";

// We'll keep these for now or refactor them later
// import { UpcomingSessionCard } from "@/components/dashboard/UpcomingSessionCard";
// import { PlayerIntelCard } from "@/components/dashboard/PlayerIntelCard";
// import { DataFreshnessAlert } from "@/components/dashboard/DataFreshnessAlert";

export const revalidate = 0; // Dynamic for now to test speed

export default async function DashboardPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const userDisplay = user.name?.split(" ")[0] ?? user.email;
  const isNameMismatched = false; // TODO: Move this check to a component if needed

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="w-full space-y-8">
        {/* HEADER */}
        {isNameMismatched && <NameSyncAlert />}

        <div className="glass-panel rounded-xl p-6 md:p-8 space-y-8">
          <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Hello, {userDisplay}
              </h1>
              <p className="text-muted-foreground mt-1.5">
                Here's your performance overview and upcoming activity.
              </p>
            </div>
            <QuickActions />
          </section>

          {/* --- 2-COLUMN LAYOUT --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* --- "SIDEBAR" (Shows first on mobile) --- */}
            <div className="lg:col-span-1 space-y-8 lg:order-2">
              <Suspense fallback={<LoadingState title="Loading Session..." message="Fetching upcoming session details" />}>
                <UpcomingSession />
              </Suspense>

              <Suspense fallback={<LoadingState title="Loading Intel..." message="Analyzing player data" />}>
                <PlayerIntel />
              </Suspense>

              <Suspense fallback={<LoadingState title="Checking Data..." message="Verifying data freshness" />}>
                <DataFreshness />
              </Suspense>
            </div>

            {/* --- MAIN CONTENT (Shows second on mobile) --- */}
            <div className="lg:col-span-2 space-y-8 lg:order-1">
              {/* USER STATS (BENTO GRID) */}
              <Suspense fallback={<LoadingState title="Loading Stats..." message="Crunching your performance numbers" />}>
                <UserStats />
              </Suspense>

              {/* TEAM CARDS */}
              <Suspense fallback={<LoadingState title="Loading Teams..." message="Fetching your squads" />}>
                <TeamList />
              </Suspense>

              {/* TOURNAMENTS */}
              <Suspense fallback={<LoadingState title="Loading Tournaments..." message="Retrieving tournament history" />}>
                <TournamentList />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function QuickActions() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="shadow-sm glass-btn-secondary border-primary/20">
          <Plus size={16} className="mr-1.5" />
          Quick Actions
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-6 bg-background/60 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-2xl mx-auto w-full">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
            <Swords className="text-primary" /> Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CreateEntityDialog type="team" triggerText="Create New Team" />
            <CreateEntityDialog
              type="tournament"
              triggerText="Create New Tournament"
            />
            <Button
              variant="outline"
              asChild
              className="group relative overflow-hidden glass-card hover:bg-primary/10 border-primary/20"
            >
              <Link href="/packages">
                <Package
                  size={16}
                  className="mr-1.5 transition-transform group-hover:scale-110"
                />
                View Packages
              </Link>
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function NameSyncAlert() {
  return (
    <Alert
      variant="destructive"
      className="bg-destructive/10 border-destructive/50"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-semibold">Account Name Mismatch</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between">
        Your display name doesn't match your profile. Sync your name for
        accurate stats.
        <Button asChild variant="link" className="text-destructive-foreground p-0 sm:pr-4 h-auto mt-2 sm:mt-0">
          <Link href="/settings">
            Go to Settings <Settings className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}