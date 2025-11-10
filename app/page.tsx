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
  Lightbulb,
  Zap,
  Sparkles, // Corrected icon name
  History,
  User, // Added for "Recent Session"
} from "lucide-react"
import { DataFreshnessAlert } from "@/components/dashboard/DataFreshnessAlert"

export const revalidate = 86400 // Revalidate every 24 hours (60 * 60 * 24)

/* -------------------------------------------------------------------------- */
/* Data Fetching                                                              */
/* -------------------------------------------------------------------------- */
type DashboardData = PromiseReturnType<typeof getDashboardData>
type PartnerStat = {
  partner: string
  plays: number
  wins: number
  winRate: string
}

async function getDashboardData(userId: string) {
  // We fetch ALL data here. The filtering for "upcoming" vs "past"
  // is handled in processDashboardData for maximum accuracy.

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teamsOwned: {
        include: {
          pairStats: true,
          members: true,
          sessions: {
            include: { games: true },
            orderBy: { date: "asc" }, // <-- Order is important
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
                orderBy: { date: "asc" }, // <-- Order is important
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

/**
 * Finds the next upcoming session.
 * If none, finds the most recent past session.
 */
function findUpcomingOrRecentSession(
  allTeams: any[],
  timeZone: string
): SessionInfo {
  const now = new Date()
  const nowInKolkata = toZonedTime(now, timeZone)

  let allSessions: any[] = []
  for (const team of allTeams) {
    if (team.sessions) {
      for (const session of team.sessions) {
        allSessions.push({
          ...session,
          team: { name: team.name, slug: team.slug },
        })
      }
    }
  }
  // All sessions are already sorted ASC by date from Prisma

  // 1. Try to find an upcoming session
  const upcomingSessions = allSessions.filter(
    (s) => new Date(s.date) >= nowInKolkata
  )
  if (upcomingSessions.length > 0) {
    // The first one in the list is the next upcoming
    return { session: upcomingSessions[0], isUpcoming: true }
  }

  // 2. If no upcoming, find the most recent past session
  const pastSessions = allSessions.filter(
    (s) => new Date(s.date) < nowInKolkata
  )
  if (pastSessions.length > 0) {
    // The last one in the list is the most recent past
    return { session: pastSessions[pastSessions.length - 1], isUpcoming: false }
  }

  // 3. If no sessions at all
  return { session: null, isUpcoming: false }
}

/**
 * Generates a random "fact" based on player stats.
 */
function generatePlayerFact(
  stats: { totalWins: number; totalLosses: number; totalGames: number; winRate: string },
  teamStats: any[],
  partnerStats: PartnerStat[],
  userDisplay: string
): PlayerFact {

  const facts: PlayerFact[] = []
  const { totalWins, totalGames, winRate } = stats
  const numericWinRate = parseFloat(winRate)

  // === Fact 1: Milestone Facts ===
  if (totalGames > 50) {
    facts.push({
      icon: Zap,
      title: "Veteran Player",
      text: `You've competed in over ${totalGames} games! That's serious dedication.`,
    })
  } else if (totalGames > 20) {
    facts.push({
      icon: Zap,
      title: "Active Competitor",
      text: `With ${totalGames} games played, you're a regular on the court.`,
    })
  } else if (totalGames === 1) {
    facts.push({
      icon: Sparkles,
      title: "Welcome to the Game!",
      text: "You've completed your first game. This is just the beginning!",
    })
  }

  // === Fact 2: Win/Performance Facts ===
  if (totalWins > 25) {
    facts.push({
      icon: Trophy,
      title: "Winning Machine",
      text: `You've racked up an impressive ${totalWins} wins. Keep it up!`,
    })
  }

  if (numericWinRate > 65 && totalGames > 10) {
    facts.push({
      icon: Target,
      title: "Dominating the Court",
      text: `You're winning ${winRate}% of your games. Truly impressive!`,
    })
  } else if (numericWinRate < 40 && totalGames > 10) {
    facts.push({
      icon: Lightbulb,
      title: "Comeback Season",
      text: "Every game is a learning opportunity. Let's work on boosting that win rate!",
    })
  }

  // === Fact 3: Team Facts ===
  const bestTeam = [...teamStats]
    .filter((t) => t.plays > 5) // Min 5 games to be considered
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0]


  const mostPlayedTeam = [...teamStats]
    .sort((a, b) => b.plays - a.plays)[0]

  if (mostPlayedTeam && mostPlayedTeam.teamName !== bestTeam?.teamName) {
    facts.push({
      icon: Users,
      title: "Your Home Court",
      text: `You're a loyal member of ${mostPlayedTeam.teamName}, with ${mostPlayedTeam.plays} games played.`,
    })
  }

  // === Fact 4: Partner Facts (The new hotness!) ===
  const bestPartner = [...partnerStats]
    .filter((p) => p.plays > 5) // Min 5 games
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0]

  if (bestPartner) {
    facts.push({
      icon: Sparkles, // Using Sparkles for 'magic'
      title: "Dynamic Duo",
      text: `You and ${bestPartner.partner} are a force, winning ${bestPartner.winRate}% of your ${bestPartner.plays} games!`,
    })
  }

  const mostPlayedPartner = [...partnerStats]
    .sort((a, b) => b.plays - a.plays)[0]

  if (mostPlayedPartner && mostPlayedPartner.partner !== bestPartner?.partner) {
    facts.push({
      icon: Swords,
      title: "Go-To Partner",
      text: `You've battled in ${mostPlayedPartner.plays} games with ${mostPlayedPartner.partner}. That's teamwork!`,
    })
  }

  if (partnerStats.length === 0 && totalGames > 5) {
    facts.push({
      icon: User, // Might need to import `User` from lucide-react
      title: "The Lone Wolf",
      text: "You've played all your games solo or haven't recorded pair stats yet. Find a partner!",
    })
  }

  // === Fallback Fact ===
  // If no other facts were generated (e.g., user has 0 games),
  // add the default welcome message.
  if (facts.length === 0) {
    facts.push({
      icon: Sparkles,
      title: `Ready, ${userDisplay}?`,
      text: "Here's your intel. Track your stats, manage teams, and dominate the court.",
    })
  }

  // Pick one fact at random from all available facts
  return facts[Math.floor(Math.random() * facts.length)]
}

/**
 * Main data processing function
 */
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

  // --- NEW: Compute Partner Stats ---
  const partnerMap = new Map<string, { plays: number; wins: number }>()

  for (const team of allTeams) {
    for (const stat of team.pairStats) {
      let partnerName: string | null = null

      // Check if this stat involves the current user
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

  // Convert the map to an array, just like teamStats
  const partnerStats = Array.from(partnerMap.entries()).map(
    ([partner, data]) => ({
      partner,
      ...data,
      winRate: data.plays > 0 ? ((data.wins / data.plays) * 100).toFixed(1) : "0",
    })
  )



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
  const totalPoints = totalWins * 3 + totalGames // Example formula

  // --- 3. Compute team-specific stats ---
  const teamStats = allTeams.map((t) => {
    let plays = 0,
      wins = 0
    for (const s of t.sessions)
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
    // ... (your tournament game loop for team stats) ...

    return {
      teamName: t.name,
      plays,
      wins,
      winRate: plays > 0 ? ((wins / plays) * 100).toFixed(1) : "0",
    }
  })

  // --- 4. Compute Upcoming Session & Player Fact ---
  const sessionInfo = findUpcomingOrRecentSession(allTeams, "Asia/Kolkata")

  const playerFact = generatePlayerFact(
    { totalWins, totalLosses, totalGames, winRate }, // Pass winRate too
    teamStats,
    partnerStats, // <-- Pass new partner stats
    dbUser.name?.split(" ")[0] ?? dbUser.email
  )

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
    hasTeams: allTeams.length > 0,
    hasTournaments: allTournaments.length > 0,
    partnerStats, // <-- New prop
    sessionInfo, // <-- Updated prop
    playerFact,
  }
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */
export default async function DashboardPage() {
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
    sessionInfo, // <-- Updated prop
    playerFact,
  } = processDashboardData(dbUser)

  const { totalPoints, totalWins, totalLosses, winRate, totalGames } = stats

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background text-foreground">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* HEADER */}
        <section className="rounded-xl border border-primary/20 bg-card/70 backdrop-blur-sm shadow-lg p-6 transition-all duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <LayoutDashboard className="text-primary" size={32} />
                Welcome back, {userDisplay}
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's your dashboard. Track progress, manage teams, and stay
                ahead.
              </p>
            </div>
            <QuickActions />
          </div>
        </section>

        {/* --- 2-COLUMN LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* --- "SIDEBAR" (Shows first on mobile) --- */}
          {/* lg:order-2 makes it the second column on desktop */}
          <div className="lg:col-span-1 space-y-8 lg:order-2">
            <UpcomingSessionCard sessionInfo={sessionInfo} />
            <PlayerIntelCard fact={playerFact} />
            <DataFreshnessAlert />
          </div>

          {/* --- MAIN CONTENT (Shows second on mobile) --- */}
          {/* lg:order-1 makes it the first column on desktop */}
          <div className="lg:col-span-2 space-y-8 lg:order-1">

            {/* USER STATS */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Points"
                value={totalPoints}
                icon={<Star className="text-yellow-500" />}
              />
              <StatCard
                title="Total Wins"
                value={totalWins}
                icon={<CheckCircle2 className="text-green-500" />}
              />
              <StatCard
                title="Total Losses"
                value={totalLosses}
                icon={<XCircle className="text-red-500" />}
              />
              <StatCard
                title="Win Rate"
                value={`${winRate}%`}
                icon={
                  <LineChart
                    className={getWinRateColorClass(parseFloat(winRate))}
                  />
                }
                valueClassName={getWinRateColorClass(parseFloat(winRate))}
              />
            </section>

            {/* EMPTY STATE */}
            {!hasTeams && !hasTournaments && <EmptyState />}

            {/* TEAM CARDS */}
            {hasTeams && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Your Teams</h2>
                <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {allTeams.map((t) => {
                    const stat = teamStats.find((x) => x.teamName === t.name)
                    const isOwner = t.ownerId === userId
                    const teamWinRate = parseFloat(stat?.winRate || "0")
                    const teamWinRateColorClass =
                      getWinRateColorClass(teamWinRate)

                    return (
                      <Card
                        key={t.id}
                        className="relative overflow-hidden group border border-primary/10 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{t.name}</CardTitle>
                            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md flex items-center gap-1.5 border border-border">
                              <Users size={14} />
                              {t.members.length} members
                            </span>
                          </div>
                          {stat && stat.plays > 0 && (
                            <p className="text-sm text-muted-foreground pt-1 flex items-center gap-1">
                              {stat.plays} games ·{" "}
                              <span className={teamWinRateColorClass}>
                                {stat.wins} wins
                              </span>
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
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
                <h2 className="text-2xl font-semibold mb-4">
                  Your Tournaments
                </h2>
                <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {allTournaments.map((t) => {
                    const isOwner = t.ownerId === userId
                    return (
                      <Card
                        key={t.id}
                        className="relative overflow-hidden group border border-primary/10 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{t.name}</CardTitle>
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${t.isActive
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700"
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
                        <CardContent>
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
                <h2 className="text-2xl font-semibold mb-4">
                  Performance Snapshot
                </h2>
                <Card className="border border-primary/10 bg-card/70 backdrop-blur-sm shadow-lg">
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

function StatCard({
  title,
  value,
  icon,
  valueClassName = "",
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  valueClassName?: string
}) {
  return (
    <Card className="border border-primary/10 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className={`text-4xl font-bold ${valueClassName}`}>{value}</div>
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
      <DrawerContent className="p-6 bg-card/90 backdrop-blur-md border-t border-primary/20">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
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
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-card/70 backdrop-blur-sm p-12 space-y-4 text-center">
        <Info size={48} className="text-primary animate-bounce-slow" />
        <h3 className="text-2xl font-semibold text-primary-foreground">
          Your dashboard is empty
        </h3>
        <p className="text-muted-foreground max-w-md">
          You haven&apos;t created or joined any teams or tournaments yet.
          <br />
          Use the <span className="font-semibold text-primary">
            Quick Actions
          </span>{" "}
          menu above to get started.
        </p>
      </div>
    </section>
  )
}

function getWinRateColorClass(winRate: number): string {
  if (winRate < 20) return "text-red-500"
  if (winRate < 40) return "text-red-400"
  if (winRate < 50) return "text-yellow-500"
  if (winRate < 60) return "text-yellow-400"
  if (winRate < 80) return "text-green-400"
  return "text-green-500"
}