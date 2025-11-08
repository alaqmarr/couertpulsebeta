import SyncNameButton from "@/components/SyncNameButton"
import UpdateDisplayNameCard from "@/components/UpdateDisplayNameCard"
import { prisma } from "@/lib/db"
import { getOrCreateUser } from "@/lib/clerk"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
    const user = await getOrCreateUser()
    if (!user) return null

    const clerkUser = await prisma.clerkUser.findUnique({
        where: { id: user.clerkUserId ?? "" },
    })

    const teams = await prisma.teamMember.findMany({
        where: { userId: user.id },
        include: { team: true },
    })

    const isSynced =
        user.name?.trim() === clerkUser?.fullName?.trim() &&
        !!clerkUser?.fullName?.trim()

    return (
        <main className="min-h-screen bg-background text-foreground p-8 space-y-8">
            <section className="max-w-3xl space-y-6">
                {/* --- Profile Sync --- */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage how your name and display identity appear across CourtPulse.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Clerk Sync</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <SyncNameButton isSynced={isSynced} />
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                                <span className="font-medium">App Name:</span>{" "}
                                {user.name || <span className="italic">Not set</span>}
                            </p>
                            <p>
                                <span className="font-medium">Clerk Name:</span>{" "}
                                {clerkUser?.fullName || <span className="italic">Not available</span>}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                {/* --- Display Names --- */}
                <Card>
                    <CardHeader>
                        <CardTitle>Display Names in Teams</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {teams.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                You haven&apos;t joined any teams yet.
                            </p>
                        ) : (
                            <div className="grid gap-3">
                                {teams.map((tm) => (
                                    <UpdateDisplayNameCard
                                        key={tm.id}
                                        teamName={tm.team.name}
                                        currentDisplayName={tm.displayName}
                                        memberId={tm.id}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </main>
    )
}
