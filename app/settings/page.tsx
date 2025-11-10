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
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background text-foreground p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-10">
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

            <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Profile Sync</span>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className={
                        isAppClerkSynced
                          ? "text-green-500 border-green-500"
                          : "text-red-500 border-red-500"
                      }
                    >
                      {isAppClerkSynced ? "App ↔ Clerk Synced" : "Out of Sync"}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Synchronize your name across your Clerk account and CourtPulse.
                </p>
                <div className="p-3 rounded-md border bg-muted/50 space-y-1 text-sm">
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
                    className="flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    {isAppClerkSynced ? "Already Synced" : "Sync from Clerk"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </aside>

          {/* RIGHT COLUMN */}
          <section className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
              <Users size={20} />
              Team-Specific Identity
            </h2>

            {teams.length === 0 ? (
              <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
                <CardContent className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
                  <Info size={24} className="text-primary" />
                  <p className="text-muted-foreground text-sm">
                    You aren&APOS;t part of any teams yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {teams.map((tm) => {
                  const inSyncWithApp = tm.displayName?.trim() === appName?.trim();
                  const inSyncWithClerk = tm.displayName?.trim() === clerkName?.trim();
                  return (
                    <Card
                      key={tm.id}
                      className="bg-card/70 backdrop-blur-sm border border-primary/10 hover:border-primary/30 transition-all"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                          <span>{tm.team.name}</span>
                          <div className="flex gap-2">
                            <Badge
                              variant="outline"
                              className={
                                inSyncWithApp
                                  ? "text-green-500 border-green-500"
                                  : "text-yellow-500 border-yellow-500"
                              }
                            >
                              App Sync
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                inSyncWithClerk
                                  ? "text-green-500 border-green-500"
                                  : "text-yellow-500 border-yellow-500"
                              }
                            >
                              Clerk Sync
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm space-y-1 p-2 bg-muted/50 rounded border">
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
                              className="flex-1 px-2 py-1 rounded-md border bg-background text-sm"
                              placeholder="New display name..."
                            />
                            <Button
                              type="submit"
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <RefreshCw size={14} /> Update
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
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
