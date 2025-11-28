import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Users, UserCheck, RefreshCw, Info } from "lucide-react";
import { revalidatePath } from "next/cache";
import { syncUserNameAction, updateDisplayNameAction } from "./settings-actions.server";

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

  const appName = user.name?.trim() ?? "";
  const clerkName = clerkUser?.fullName?.trim() ?? "";
  const isAppClerkSynced = appName === clerkName && !!clerkName;

  return (
    <main className="min-h-screen text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto glass-panel rounded-xl p-6 md:p-10 space-y-10">
        {/* HEADER */}
        <section>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings size={28} className="text-primary" />
            Profile & Identity
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your global and team-specific display names.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT COLUMN */}
          <aside className="lg:col-span-1 space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
              <UserCheck size={20} />
              Global Identity
            </h2>

            <div className="glass-card rounded-xl p-1 border-primary/10">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold leading-none tracking-tight">Profile Sync</h3>
                  <Badge
                    variant="outline"
                    className={
                      isAppClerkSynced
                        ? "text-green-500 border-green-500 bg-green-500/10"
                        : "text-red-500 border-red-500 bg-red-500/10"
                    }
                  >
                    {isAppClerkSynced ? "App ↔ Clerk Synced" : "Out of Sync"}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Synchronize your name across your Clerk account and CourtPulse.
                  </p>
                  <div className="p-3 rounded-md border border-white/5 bg-black/20 space-y-1 text-sm">
                    <p>
                      <span className="font-medium text-foreground">App Name:</span>{" "}
                      {appName || <span className="italic text-muted-foreground">Not set</span>}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Clerk Name:</span>{" "}
                      {clerkName || (
                        <span className="italic text-muted-foreground">Not available</span>
                      )}
                    </p>
                  </div>

                  <form action={async () => {
                    "use server";
                    await syncUserNameAction();
                    revalidatePath("/settings");
                  }}>
                    <Button
                      type="submit"
                      disabled={isAppClerkSynced}
                      variant={isAppClerkSynced ? "outline" : "default"}
                      className="flex items-center gap-2 w-full justify-center glass-button"
                    >
                      <RefreshCw size={16} />
                      {isAppClerkSynced ? "Already Synced" : "Sync from Clerk"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN */}
          <section className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
              <Users size={20} />
              Team-Specific Identity
            </h2>

            {teams.length === 0 ? (
              <div className="glass-card rounded-xl p-6 border-primary/10 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary/20 bg-muted/5">
                <Info size={24} className="text-primary" />
                <p className="text-muted-foreground text-sm">
                  You aren&apos;t part of any teams yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {teams.map((tm) => {
                  const inSyncWithApp = tm.displayName?.trim() === appName?.trim();
                  const inSyncWithClerk = tm.displayName?.trim() === clerkName?.trim();
                  return (
                    <div
                      key={tm.id}
                      className="glass-card rounded-xl p-6 border-primary/10 hover:border-primary/30 transition-all space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{tm.team.name}</span>
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className={
                              inSyncWithApp
                                ? "glass-badge-success"
                                : "glass-badge-warning"
                            }
                          >
                            App Sync
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              inSyncWithClerk
                                ? "glass-badge-success"
                                : "glass-badge-warning"
                            }
                          >
                            Clerk Sync
                          </Badge>
                        </div>
                      </div>

                      <div className="text-sm space-y-1 p-2 bg-black/20 rounded border border-white/5">
                        <p>
                          <span className="font-medium text-foreground">Display Name:</span>{" "}
                          {tm.displayName || <span className="italic">Not set</span>}
                        </p>
                      </div>

                      <form
                        action={async (formData) => {
                          "use server";
                          const name = formData.get("name") as string;
                          await updateDisplayNameAction(tm.id, name);
                          revalidatePath("/settings");
                        }}
                      >
                        <div className="flex gap-2">
                          <input
                            name="name"
                            defaultValue={tm.displayName ?? ""}
                            className="flex-1 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="New display name..."
                          />
                          <Button
                            type="submit"
                            variant="secondary"
                            className="flex items-center gap-1 glass-button"
                          >
                            <RefreshCw size={14} /> Update
                          </Button>
                        </div>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
