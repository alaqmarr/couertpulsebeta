import SyncNameButton from "@/components/SyncNameButton";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";

export default async function SettingsPage() {
  const user = await getOrCreateUser();

  const clerkUser = await prisma.clerkUser.findUnique({
    where: { id: user?.clerkUserId ?? "" },
  });

  const isSynced =
    user?.name?.trim() === clerkUser?.fullName?.trim() &&
    clerkUser?.fullName !== null;

  return (
    <main className="min-h-screen p-8 space-y-8">
      <section className="max-w-lg space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground text-sm">
          Keep your app name synced with your Clerk profile.
        </p>

        <div className="flex items-center gap-4">
          <SyncNameButton isSynced={isSynced} />
          {user?.name && (
            <p className="text-sm text-muted-foreground">
              Current: <span className="font-medium">{user.name}</span>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
