// Imports (Data, UI, and Icons)
import { getOrCreateUser } from "@/lib/clerk";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import type { Prisma, PromiseReturnType } from "@prisma/client";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import CreateEntityDialog from "@/components/CreateEntityDialog";
import WinRateChart from "@/components/WinRateChart"; // Assuming this component exists and handles its own colors

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
  CheckCircle2, // More pronounced win icon
  XCircle, // More pronounced loss icon
  LineChart, // Icon for Win Rate
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* -------------------------------------------------------------------------- */
/* Data Fetching                                */
/* -------------------------------------------------------------------------- */
/**
 * A type helper to get the full return type of our data query
 */
type DashboardData = PromiseReturnType<typeof getDashboardData>;

/**
 * Fetches all necessary dashboard data for a given user.
 * Keeping data fetching separate makes the component cleaner.
 */
async function getDashboardData(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teamsOwned: {
        include: {
          members: true,
          sessions: { include: { games: true } },
          tournamentTeams: {
            include: { tournament: true, tournamentGamesA: true, tournamentGamesB: true },
          },
        },
      },
      memberships: {
        include: {
          team: {
            include: {
              members: true,
              sessions: { include: { games: true } },
              tournamentTeams: {
                include: { tournament: true, tournamentGamesA: true, tournamentGamesB: true },
              },
            },
          },
        },
      },
      tournamentsOwned: {
        include: { games: true },
      },
    },
  });
  return dbUser;
}

/* -------------------------------------------------------------------------- */
/* Data Processing                              */
/* -------------------------------------------------------------------------- */
/**
 * Processes the raw database data into computed stats and lists.
 * Keeping this "business logic" separate is crucial for maintainability.
 */
function processDashboardData(dbUser: NonNullable<DashboardData>) {
  // --- 1. Assemble data sets ---
  const ownedTeams = dbUser.teamsOwned ?? [];
  const memberTeams = dbUser.memberships.map((m: any) => m.team);
  const allTeams = [
    ...ownedTeams,
    ...memberTeams.filter((t: any) => !ownedTeams.some((o: any) => o.id === t.id)),
  ];

  const hostedTournaments = dbUser.tournamentsOwned ?? [];
  const participatedTournaments = [
    ...new Map(
      allTeams
        .flatMap((t) => t.tournamentTeams.map((tt: any) => tt.tournament))
        .filter(Boolean)
        .map((t) => [t.id, t])
    ).values(),
  ];
  const allTournaments = [
    ...hostedTournaments,
    ...participatedTournaments.filter((p) => !hostedTournaments.some((h: any) => h.id === p.id)),
  ];

  // --- 2. Compute statistics ---
  let totalWins = 0,
    totalLosses = 0,
    totalGames = 0;

  const userEmail = dbUser.email;
  const userDisplay = dbUser.displayName ?? dbUser.name ?? dbUser.email;

  for (const team of allTeams) {
    // Session games
    for (const s of team.sessions) {
      for (const g of s.games) {
        const inA = g.teamAPlayers.includes(userEmail) || g.teamAPlayers.includes(userDisplay);
        const inB = g.teamBPlayers.includes(userEmail) || g.teamBPlayers.includes(userDisplay);
        if (inA || inB) {
          totalGames++;
          if ((g.winner === "A" && inA) || (g.winner === "B" && inB)) totalWins++;
          else if (g.winner) totalLosses++;
        }
      }
    }
    // Tournament games
    for (const tt of team.tournamentTeams) {
      for (const g of tt.tournamentGamesA) {
        if (g.teamAPlayers.includes(userEmail) || g.teamAPlayers.includes(userDisplay)) {
          totalGames++;
          if (g.winningTeam === "A") totalWins++;
          else if (g.winningTeam === "B") totalLosses++;
        }
      }
      for (const g of tt.tournamentGamesB) {
        if (g.teamBPlayers.includes(userEmail) || g.teamBPlayers.includes(userDisplay)) {
          totalGames++;
          if (g.winningTeam === "B") totalWins++;
          else if (g.winningTeam === "A") totalLosses++;
        }
      }
    }
  }

  const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : "0";
  const totalPoints = totalWins * 3 + totalGames; // Example formula

  // --- 3. Compute team-specific stats ---
  const teamStats = allTeams.map((t) => {
    let plays = 0,
      wins = 0;
    for (const s of t.sessions)
      for (const g of s.games) {
        const inA = g.teamAPlayers.includes(userEmail) || g.teamAPlayers.includes(userDisplay);
        const inB = g.teamBPlayers.includes(userEmail) || g.teamBPlayers.includes(userDisplay);
        if (inA || inB) {
          plays++;
          if ((g.winner === "A" && inA) || (g.winner === "B" && inB)) wins++;
        }
      }
    for (const tt of t.tournamentTeams)
      for (const g of [...tt.tournamentGamesA, ...tt.tournamentGamesB]) {
        const inTeam =
          g.teamAPlayers.includes(userEmail) ||
          g.teamBPlayers.includes(userEmail) ||
          g.teamAPlayers.includes(userDisplay) ||
          g.teamBPlayers.includes(userDisplay);
        if (inTeam) {
          plays++;
          if (
            (g.winningTeam === "A" && tt.tournamentGamesA.some((x: any) => x.id === g.id)) ||
            (g.winningTeam === "B" && tt.tournamentGamesB.some((x: any) => x.id === g.id))
          )
            wins++;
        }
      }
    return { teamName: t.name, plays, wins, winRate: plays > 0 ? ((wins / plays) * 100).toFixed(1) : "0" };
  });

  // --- 4. Return processed data ---
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
  };
}

/* -------------------------------------------------------------------------- */
/* Main Component                               */
/* -------------------------------------------------------------------------- */
export default async function DashboardPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const dbUser = await getDashboardData(user.id);
  if (!dbUser) redirect("/sign-up"); // Or a "complete profile" page

  // Process data to get computed values
  const {
    userDisplay,
    userId,
    stats,
    allTeams,
    allTournaments,
    teamStats,
    hasTeams,
    hasTournaments,
  } = processDashboardData(dbUser);

  const { totalPoints, totalWins, totalLosses, winRate, totalGames } = stats;

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
                Track your progress, manage your teams, and stay ahead of the competition.
              </p>
            </div>
            <QuickActions />
          </div>
        </section>


        {/* USER STATS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Points" value={totalPoints} icon={<Star className="text-yellow-500" />} />
          <StatCard title="Total Wins" value={totalWins} icon={<CheckCircle2 className="text-green-500" />} />
          <StatCard title="Total Losses" value={totalLosses} icon={<XCircle className="text-red-500" />} />
          <StatCard
            title="Win Rate"
            value={`${winRate}%`}
            icon={<LineChart className={getWinRateColorClass(parseFloat(winRate))} />}
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
                const stat = teamStats.find((x) => x.teamName === t.name);
                const isOwner = t.ownerId === userId;
                const teamWinRate = parseFloat(stat?.winRate || "0");
                const teamWinRateColorClass = getWinRateColorClass(teamWinRate);

                return (
                  <Card
                    key={t.id}
                    className="relative overflow-hidden group border border-primary/10 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
                  >
                    {/* Optional: subtle background gradient or texture on hover */}
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
                      <Button asChild variant={isOwner ? "default" : "outline"} className="w-full">
                        <Link href={`/team/${t.slug}`}>
                          {isOwner ? "Manage Team" : "View Team"}
                        </Link>
                      </Button>
                      <Button asChild variant="secondary" className="w-full">
                        <Link href={`/team/${t.slug}/stats`}>View Stats</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* TOURNAMENTS */}
        {hasTournaments && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Tournaments</h2>
            <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allTournaments.map((t) => {
                const isOwner = t.ownerId === userId;
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
                        Created {formatInTimeZone(t.createdAt, "Asia/Kolkata", "d MMM yyyy")}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant={isOwner ? "default" : "secondary"} className="w-full">
                        <Link href={`/tournament/${t.slug}`}>
                          {isOwner ? "Manage Tournament" : "View Tournament"}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* PERFORMANCE SNAPSHOT */}
        {totalGames > 0 && teamStats.some((t) => t.plays > 0) && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Performance Snapshot</h2>
            <Card className="border border-primary/10 bg-card/70 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4 md:p-6">
                <div className="h-[300px] w-full">
                  <WinRateChart stats={teamStats.filter((x) => x.plays > 0)} />
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper Components                             */
/* -------------------------------------------------------------------------- */

/**
 * A new, improved StatCard with icon support and dynamic value styling
 */
function StatCard({
  title,
  value,
  icon,
  valueClassName = "", // Added for dynamic styling of the value
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <Card className="border border-primary/10 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className={`text-4xl font-bold ${valueClassName}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

/**
 * A dedicated component for the Quick Actions drawer
 */
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
          <CreateEntityDialog type="tournament" triggerText="Create New Tournament" />
          <Button variant="outline" asChild className="group relative overflow-hidden">
            <Link href="/packages">
              <Package size={16} className="mr-1.5 transition-transform group-hover:scale-110" />
              View Packages
            </Link>
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * A dedicated empty state component for a better first-time user experience
 */
function EmptyState() {
  return (
    <section>
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-card/70 backdrop-blur-sm p-12 space-y-4 text-center">
        <Info size={48} className="text-primary animate-bounce-slow" />
        <h3 className="text-2xl font-semibold text-primary-foreground">Your dashboard is empty</h3>
        <p className="text-muted-foreground max-w-md">
          You haven&apos;t created or joined any teams or tournaments yet.
          <br />
          Use the <span className="font-semibold text-primary">Quick Actions</span> menu above to get started.
        </p>
      </div>
    </section>
  );
}

/**
 * Helper function to determine Tailwind color class based on win rate.
 * Transitions from red (0%) to green (100%), yellow around 50%.
 */
function getWinRateColorClass(winRate: number): string {
  if (winRate < 20) return "text-red-500";
  if (winRate < 40) return "text-red-400";
  if (winRate < 50) return "text-yellow-500";
  if (winRate < 60) return "text-yellow-400";
  if (winRate < 80) return "text-green-400";
  return "text-green-500";
}