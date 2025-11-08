// Imports (Data, UI, and Icons)
import SyncNameButton from "@/components/SyncNameButton";
import UpdateDisplayNameCard from "@/components/UpdateDisplayNameCard";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; // We'll use this inside the left col
import { Badge } from "@/components/ui/badge";

// Icons
import { Settings, RefreshCw, Users, Info, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getOrCreateUser();
  if (!user) return null;

  const clerkUser = await prisma.clerkUser.findUnique({
    where: { id: user.clerkUserId ?? "" },
  });

  const teams = await prisma.teamMember.findMany({
    where: { userId: user.id },
    include: { team: true },
  });

  const isSynced =
    user.name?.trim() === clerkUser?.fullName?.trim() && !!clerkUser?.fullName?.trim();

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background text-foreground p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* --- Page Header --- */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings size={28} className="text-primary" />
            Profile & Identity
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your global profile and team-specific display names.
          </p>
        </section>

        {/* --- Two-Column Layout --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* --- LEFT (Sticky) COLUMN --- */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
              <UserCheck size={20} />
              Global Identity
            </h2>
            <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Profile Sync</span>
                  <Badge
                    variant="outline"
                    className={
                      isSynced
                        ? "text-green-500 border-green-500"
                        : "text-red-500 border-red-500"
                    }
                  >
                    {isSynced ? "Synced" : "Out of Sync"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sync your name from your main Clerk account to CourtPulse.
                </p>
                <div className="text-sm space-y-1.5 p-3 bg-muted/50 rounded-md border">
                  <p>
                    <span className="font-medium text-foreground">App Name:</span>{" "}
                    {user.name || <span className="italic">Not set</span>}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Clerk Name:</span>{" "}
                    {clerkUser?.fullName || <span className="italic">Not available</span>}
                  </p>
                </div>
                <SyncNameButton isSynced={isSynced} />
              </CardContent>
            </Card>
          </aside>

          {/* --- RIGHT (Main) COLUMN --- */}
          <section className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
              <Users size={20} />
              Team-Specific Identity
            </h2>
            <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
              <CardHeader>
                <CardTitle>Display Names</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Set a custom display name for each team you are a part of.
                  This name will be used in team rosters and score sheets.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {teams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
                    <Info size={24} className="text-primary" />
                    <p className="text-muted-foreground text-sm">
                      You haven&apos;t joined any teams yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {teams.map((tm) => (
                      <UpdateDisplayNameCard
                        key={tm.id}
                        teamName={tm.team.name}
                        currentDisplayName={tm.displayName}
                        memberId={tm.id}
                        // This component will render inside the card
                        // and will look great as a list.
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

        </div>
      </div>
    </main>
  );
}