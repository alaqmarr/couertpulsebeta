import { getOrCreateUser } from "@/lib/clerk";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import WinRateChart from "@/components/WinRateChart";
import CreateEntityDialog from "@/components/CreateEntityDialog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
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

  if (!dbUser) redirect("/sign-up");

  // --- Assemble data sets ---
  const ownedTeams = dbUser.teamsOwned ?? [];
  const memberTeams = dbUser.memberships.map((m) => m.team);
  const allTeams = [
    ...ownedTeams,
    ...memberTeams.filter((t) => !ownedTeams.some((o) => o.id === t.id)),
  ];

  const hostedTournaments = dbUser.tournamentsOwned ?? [];
  const participatedTournaments = [
    ...new Map(
      allTeams
        .flatMap((t) => t.tournamentTeams.map((tt) => tt.tournament))
        .filter(Boolean)
        .map((t) => [t.id, t])
    ).values(),
  ];
  const allTournaments = [
    ...hostedTournaments,
    ...participatedTournaments.filter((p) => !hostedTournaments.some((h) => h.id === p.id)),
  ];

  // --- Compute statistics ---
  let totalWins = 0,
    totalLosses = 0,
    totalGames = 0;

  const userEmail = dbUser.email;
  const userDisplay = dbUser.displayName ?? dbUser.name ?? dbUser.email;

  for (const team of allTeams) {
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
  const totalPoints = totalWins * 3 + totalGames; // adjust formula if needed

  const hasTeams = allTeams.length > 0;
  const hasTournaments = allTournaments.length > 0;

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
            (g.winningTeam === "A" && tt.tournamentGamesA.some((x) => x.id === g.id)) ||
            (g.winningTeam === "B" && tt.tournamentGamesB.some((x) => x.id === g.id))
          )
            wins++;
        }
      }
    return { teamName: t.name, plays, wins };
  });

  // --- UI ---
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-8 space-y-10">
        {/* HEADER */}
        <section className="rounded-2xl border bg-linear-to-br from-primary/5 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {dbUser.name?.split(" ")[0] ?? dbUser.email}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your progress, manage your teams, and stay ahead of the competition.
              </p>
            </div>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="secondary">Quick Actions</Button>
              </DrawerTrigger>
              <DrawerContent className="p-6 space-y-4">
                {/* Replace old Drawer Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <CreateEntityDialog type="team" triggerText="Create Team" />
                  <CreateEntityDialog type="tournament" triggerText="Create Tournament" />
                  <Link href="/packages">
                    <Button variant="secondary">View Packages</Button>
                  </Link>
                </div>

              </DrawerContent>
            </Drawer>
          </div>
        </section>

        {/* USER STATS */}
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Points" value={totalPoints} subtitle="Total accumulated" />
          <StatCard title="Wins" value={totalWins} subtitle="Games won" />
          <StatCard title="Losses" value={totalLosses} subtitle="Games lost" />
          <StatCard title="Win Rate" value={`${winRate}%`} subtitle="Overall ratio" />
        </section>

        {/* EMPTY STATE ALERT */}
        {!hasTeams && !hasTournaments && (
          <Alert>
            <AlertTitle>No data yet</AlertTitle>
            <AlertDescription>
              You haven&apos;t created or joined any teams or tournaments. Use the Quick Actions
              drawer to get started.
            </AlertDescription>
          </Alert>
        )}

        {/* TEAM CARDS */}
        {hasTeams && (
          <section>
            <h2 className="text-2xl font-semibold mb-3">Your Teams</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allTeams.map((t) => {
                const stat = teamStats.find((x) => x.teamName === t.name);
                const isOwner = t.ownerId === dbUser.id;
                return (
                  <Card key={t.id} className="hover:shadow-lg transition border rounded-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{t.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {t.members.length} members
                        </span>
                      </div>
                      {stat && stat.plays > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          {stat.plays} games · {stat.wins} wins
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      <Link href={`/team/${t.slug}`}>
                        <Button className="w-full" variant={isOwner ? "default" : "outline"}>
                          {isOwner ? "Manage" : "View"}
                        </Button>
                      </Link>
                      <Link href={`/team/${t.slug}/stats`}>
                        <Button className="w-full" variant="secondary">
                          View Stats
                        </Button>
                      </Link>
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
            <h2 className="text-2xl font-semibold mb-3">Your Tournaments</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allTournaments.map((t) => {
                const isOwner = t.ownerId === dbUser.id;
                return (
                  <Card key={t.id} className="hover:shadow-lg transition border rounded-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{t.name}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded ${t.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                            }`}
                        >
                          {t.isActive ? "Active" : "Completed"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Created {formatInTimeZone(t.createdAt, "Asia/Kolkata", "d MMM yyyy")}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/tournament/${t.slug}`}>
                        <Button className="w-full" variant={isOwner ? "default" : "secondary"}>
                          {isOwner ? "Manage Tournament" : "View Tournament"}
                        </Button>
                      </Link>
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
            <h2 className="text-2xl font-semibold mb-3">Performance Snapshot</h2>
            <div className="rounded-xl border bg-card p-4">
              <div className="h-[300px]">
                <WinRateChart stats={teamStats.filter((x) => x.plays > 0)} />
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper Component                                                           */
/* -------------------------------------------------------------------------- */
function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
