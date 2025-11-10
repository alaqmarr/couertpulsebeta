// Imports (Data, UI, and Icons)
import { getOrCreateUser } from "@/lib/clerk"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatInTimeZone, toZonedTime } from "date-fns-tz"
// Note: 'isToday', 'isFuture', 'parseISO' are no longer needed
import type { Prisma, PromiseReturnType } from "@prisma/client"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer"
import CreateEntityDialog from "@/components/CreateEntityDialog" // Assuming this component exists
import WinRateChart from "@/components/WinRateChart" // Assuming this component exists

// --- COMPONENT IMPORTS ---
import {
  UpcomingSessionCard,
  type SessionInfo,
} from "@/components/dashboard/UpcomingSessionCard"
import {
  PlayerIntelCard,
  type PlayerFact,
} from "@/components/dashboard/PlayerIntelCard"
import { DataFreshnessAlert } from "@/components/dashboard/DataFreshnessAlert"

// --- UTILITY IMPORTS ---
import {
  findUpcomingOrRecentSession,
  generatePlayerFacts,
  getWinRateColorClass,
  type PartnerStat, // Import PartnerStat type
} from "@/lib/utility-functions" // Import from new utility file

// Icons
import {
  LayoutDashboard,
  Users,
  Trophy,
  Swords,
  Target,
  Plus,
  Package,
  Info,
  Star,
  CheckCircle2,
  XCircle,
  LineChart,
  AlertCircle,
  Settings,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Revalidate this page at most once every 24 hours
export const revalidate = 86400 // 60 * 60 * 24

/* -------------------------------------------------------------------------- */
/* Data Fetching                                                              */
/* -------------------------------------------------------------------------- */
type DashboardData = PromiseReturnType<typeof getDashboardData>

async function getDashboardData(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      clerkUser: true,
      teamsOwned: {
        include: {
          pairStats: true,
          members: true,
          sessions: {
            include: { games: true },
            orderBy: { date: "asc" },
          },
          tournamentTeams: {
            include: {
              tournament: true,
              tournamentGamesA: true,
              tournamentGamesB: true,
            },
          },
        },
      },
      memberships: {
        include: {
          team: {
            include: {
              pairStats: true,
              members: true,
              sessions: {
                include: { games: true },
                orderBy: { date: "asc" },
              },
              tournamentTeams: {
                include: {
                  tournament: true,
                  tournamentGamesA: true,
                  tournamentGamesB: true,
                },
              },
            },
          },
        },
      },
      tournamentsOwned: {
        include: { games: true },
      },
    },
  })
  return dbUser
}

/* -------------------------------------------------------------------------- */
/* Data Processing                                                            */
/* -------------------------------------------------------------------------- */
function processDashboardData(dbUser: NonNullable<DashboardData>) {
  // --- 1. Assemble data sets ---
  const ownedTeams = dbUser.teamsOwned ?? []
  const memberTeams = dbUser.memberships.map((m: any) => m.team)
  const allTeams = [
    ...ownedTeams,
    ...memberTeams.filter((t: any) => !ownedTeams.some((o: any) => o.id === t.id)),
  ]

  const hostedTournaments = dbUser.tournamentsOwned ?? []
  const participatedTournaments = [
    ...new Map(
      allTeams
        .flatMap((t) => t.tournamentTeams.map((tt: any) => tt.tournament))
        .filter(Boolean)
        .map((t) => [t.id, t])
    ).values(),
  ]
  const allTournaments = [
    ...hostedTournaments,
    ...participatedTournaments.filter(
      (p) => !hostedTournaments.some((h: any) => h.id === p.id)
    ),
  ]

  // --- 2. Compute statistics ---
  let totalWins = 0,
    totalLosses = 0,
    totalGames = 0

  const userEmail = dbUser.email
  const userDisplay = dbUser.displayName ?? dbUser.name ?? dbUser.email

  // --- Compute Partner Stats ---
  const partnerMap = new Map<string, { plays: number; wins: number }>()
  for (const team of allTeams) {
    for (const stat of team.pairStats) {
      let partnerName: string | null = null
      if (stat.playerA === userDisplay || stat.playerA === userEmail) {
        partnerName = stat.playerB
      } else if (stat.playerB === userDisplay || stat.playerB === userEmail) {
        partnerName = stat.playerA
      }
      if (partnerName) {
        const current = partnerMap.get(partnerName) || { plays: 0, wins: 0 }
        current.plays += stat.plays
        current.wins += stat.wins
        partnerMap.set(partnerName, current)
      }
    }
  }
  const partnerStats: PartnerStat[] = Array.from(partnerMap.entries()).map(
    ([partner, data]) => ({
      partner,
      ...data,
      winRate: data.plays > 0 ? ((data.wins / data.plays) * 100).toFixed(1) : "0",
    })
  )

  // --- Compute Total Stats (Wins, Losses, Games) ---
  for (const team of allTeams) {
    // Session games
    for (const s of team.sessions) {
      for (const g of s.games) {
        const inA =
          g.teamAPlayers.includes(userEmail) ||
          g.teamAPlayers.includes(userDisplay)
        const inB =
          g.teamBPlayers.includes(userEmail) ||
          g.teamBPlayers.includes(userDisplay)
        if (inA || inB) {
          totalGames++
          if ((g.winner === "A" && inA) || (g.winner === "B" && inB))
            totalWins++
          else if (g.winner) totalLosses++
        }
      }
    }
    // Tournament games
    for (const tt of team.tournamentTeams) {
      for (const g of tt.tournamentGamesA) {
        if (
          g.teamAPlayers.includes(userEmail) ||
          g.teamAPlayers.includes(userDisplay)
        ) {
          totalGames++
          if (g.winningTeam === "A") totalWins++
          else if (g.winningTeam === "B") totalLosses++
        }
      }
      for (const g of tt.tournamentGamesB) {
        if (
          g.teamBPlayers.includes(userEmail) ||
          g.teamBPlayers.includes(userDisplay)
        ) {
          totalGames++
          if (g.winningTeam === "B") totalWins++
          else if (g.winningTeam === "A") totalLosses++
        }
      }
    }
  }

  const winRate =
    totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : "0"
  const totalPoints = totalWins * 3 + totalGames

  // --- 3. Compute team-specific stats ---
  const teamStats = allTeams.map((t) => {
    let plays = 0,
      wins = 0
    for (const s of t.sessions) {
      for (const g of s.games) {
        const inA =
          g.teamAPlayers.includes(userEmail) ||
          g.teamAPlayers.includes(userDisplay)
        const inB =
          g.teamBPlayers.includes(userEmail) ||
          g.teamBPlayers.includes(userDisplay)
        if (inA || inB) {
          plays++
          if ((g.winner === "A" && inA) || (g.winner === "B" && inB)) wins++
        }
      }
    }
    for (const tt of t.tournamentTeams) {
      for (const g of [...tt.tournamentGamesA, ...tt.tournamentGamesB]) {
        const inTeam =
          g.teamAPlayers.includes(userEmail) ||
          g.teamBPlayers.includes(userEmail) ||
          g.teamAPlayers.includes(userDisplay) ||
          g.teamBPlayers.includes(userDisplay)
        if (inTeam) {
          plays++
          if (
            (g.winningTeam === "A" &&
              tt.tournamentGamesA.some((x: any) => x.id === g.id)) ||
            (g.winningTeam === "B" &&
              tt.tournamentGamesB.some((x: any) => x.id === g.id))
          )
            wins++
        }
      }
    }
    return {
      teamName: t.name,
      plays,
      wins,
      winRate: plays > 0 ? ((wins / plays) * 100).toFixed(1) : "0",
    }
  })

  // --- 4. Compute Upcoming Session & Player Fact ---
  const sessionInfo = findUpcomingOrRecentSession(allTeams, "Asia/Kolkata")

  const playerFacts = generatePlayerFacts(
    { totalWins, totalLosses, totalGames, winRate },
    teamStats,
    partnerStats,
    dbUser.name?.split(" ")[0] ?? dbUser.email
  )


  const isNameMismatched =
    dbUser.clerkUser &&
    dbUser.clerkUser.fullName &&
    dbUser.name !== dbUser.clerkUser.fullName

  // --- 5. Return processed data ---
  return {
    userDisplay: dbUser.name?.split(" ")[0] ?? dbUser.email,
    userId: dbUser.id,
    stats: {
      totalPoints,
      totalWins,
      totalLosses,
      winRate,
      totalGames,
    },
    allTeams,
    allTournaments,
    teamStats,
    isNameMismatched,
    hasTeams: allTeams.length > 0,
    hasTournaments: allTournaments.length > 0,
    packageType: dbUser.packageType,
    partnerStats,
    sessionInfo,
    playerFacts,
  }
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */
export default async function DashboardPage() {
  const buildTime = new Date().toISOString()
  const user = await getOrCreateUser()
  if (!user) redirect("/sign-in")

  const dbUser = await getDashboardData(user.id)
  if (!dbUser) redirect("/sign-up")

  const {
    userDisplay,
    userId,
    stats,
    allTeams,
    allTournaments,
    teamStats,
    hasTeams,
    hasTournaments,
    sessionInfo,
    isNameMismatched,
    packageType,
    playerFacts,
  } = processDashboardData(dbUser)

  const { totalPoints, totalWins, totalLosses, winRate, totalGames } = stats

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        {/* --- NEW: Conditional Alert --- */}
        {isNameMismatched && <NameSyncAlert />}

        {/* HEADER */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {/* --- UPDATED: "Hello" --- */}
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
            <UpcomingSessionCard sessionInfo={sessionInfo} />
            <PlayerIntelCard facts={playerFacts} />
            <DataFreshnessAlert
              buildTime={buildTime}
              packageType={packageType}
            />
          </div>

          {/* --- MAIN CONTENT (Shows second on mobile) --- */}
          <div className="lg:col-span-2 space-y-8 lg:order-1">
            {/* USER STATS (BENTO GRID) */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Points"
                value={totalPoints}
                icon={Star}
                accentColor="text-yellow-400"
              />
              <StatCard
                title="Total Wins"
                value={totalWins}
                icon={CheckCircle2}
                accentColor="text-primary" // Badminton Green
              />
              <StatCard
                title="Total Losses"
                value={totalLosses}
                icon={XCircle}
                accentColor="text-destructive" // Red
              />
              <StatCard
                title="Win Rate"
                value={`${winRate}%`}
                icon={LineChart}
                accentColor={getWinRateColorClass(parseFloat(winRate))}
              />
            </section>

            {/* EMPTY STATE */}
            {!hasTeams && !hasTournaments && <EmptyState />}

            {/* TEAM CARDS */}
            {hasTeams && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  Your Teams
                </h2>
                <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
                  {allTeams.map((t) => {
                    const stat = teamStats.find((x) => x.teamName === t.name)
                    const isOwner = t.ownerId === userId

                    return (
                      <Card
                        key={t.id}
                        className="flex flex-col bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-border/50 transition-all duration-300 hover:border-border hover:shadow-lg"
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{t.name}</CardTitle>
                            <span className="text-xs font-medium text-muted-foreground bg-muted/80 px-2 py-1 rounded-md flex items-center gap-1.5 border border-border/50">
                              <Users size={14} />
                              {t.members.length} members
                            </span>
                          </div>
                          {stat && stat.plays > 0 && (
                            <p className="text-sm text-muted-foreground pt-1 flex items-center gap-1">
                              {stat.plays} games ·{" "}
                              <span
                                className={getWinRateColorClass(
                                  parseFloat(stat.winRate)
                                )}
                              >
                                {stat.wins} wins
                              </span>
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-col gap-2 mt-auto pt-4">
                          <Button
                            asChild
                            variant={isOwner ? "default" : "outline"}
                            className="w-full"
                          >
                            <Link href={`/team/${t.slug}`}>
                              {isOwner ? "Manage Team" : "View Team"}
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="secondary"
                            className="w-full"
                          >
                            <Link href={`/team/${t.slug}/stats`}>
                              View Stats
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            )}

            {/* TOURNAMENTS */}
            {hasTournaments && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  Your Tournaments
                </h2>
                <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
                  {allTournaments.map((t) => {
                    const isOwner = t.ownerId === userId
                    return (
                      <Card
                        key={t.id}
                        className="flex flex-col bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-border/50 transition-all duration-300 hover:border-border hover:shadow-lg"
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{t.name}</CardTitle>
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${t.isActive
                                ? "bg-green-100/10 text-green-400 border-green-400/30"
                                : "bg-gray-100/10 text-gray-400 border-gray-400/30"
                                }`}
                            >
                              {t.isActive ? "Active" : "Completed"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground pt-1">
                            Created{" "}
                            {formatInTimeZone(
                              t.createdAt,
                              "Asia/Kolkata",
                              "d MMM yyyy"
                            )}
                          </p>
                        </CardHeader>
                        <CardContent className="mt-auto pt-4">
                          <Button
                            asChild
                            variant={isOwner ? "default" : "secondary"}
                            className="w-full"
                          >
                            <Link href={`/tournament/${t.slug}`}>
                              {isOwner
                                ? "Manage Tournament"
                                : "View Tournament"}
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            )}

            {/* PERFORMANCE SNAPSHOT */}
            {totalGames > 0 && teamStats.some((t) => t.plays > 0) && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  Performance Snapshot
                </h2>
                <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-border/50">
                  <CardContent className="p-4 md:p-6">
                    <div className="h-[300px] w-full">
                      <WinRateChart
                        stats={teamStats.filter((x) => x.plays > 0)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

/* -------------------------------------------------------------------------- */
/* Helper Components                                                          */
/* -------------------------------------------------------------------------- */

// --- NEW StatCard Component ---
function StatCard({
  title,
  value,
  icon: Icon,
  accentColor,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  accentColor: string
}) {
  return (
    <Card
      className={`relative overflow-hidden bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-border/50 group transition-all duration-300 hover:border-border/80 hover:shadow-lg hover:shadow-black/5 ${accentColor}`}
    >
      {/* Faded background icon */}
      <Icon className="absolute -right-4 -bottom-4 h-24 w-24 text-current opacity-5 group-hover:opacity-10 transition-all duration-300" />

      {/* Subtle glow effect */}
      <div className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] bg-gradient-radial from-current to-transparent opacity-0 group-hover:opacity-[0.03] transition-all duration-500" />

      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="shadow-sm">
          <Plus size={16} className="mr-1.5" />
          Quick Actions
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-6 bg-card/90 backdrop-blur-md border-t border-border/50">
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
            className="group relative overflow-hidden"
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
      </DrawerContent>
    </Drawer>
  )
}

function EmptyState() {
  return (
    <section>
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/80 bg-gradient-to-br from-card/80 to-card/70 backdrop-blur-sm p-12 space-y-4 text-center">
        <Info size={48} className="text-primary" />
        <h3 className="text-2xl font-semibold text-foreground">
          Your dashboard is empty
        </h3>
        <p className="text-muted-foreground max-w-md">
          You haven&apos;t created or joined any teams or tournaments yet.
          <br />
          Use the{" "}
          <span className="font-semibold text-primary">Quick Actions</span> menu
          to get started.
        </p>
      </div>
    </section>
  )
}

// --- NEW: Alert Component for Name Sync ---
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
  )
}