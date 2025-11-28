import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, Activity, PlayCircle, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default async function TournamentDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getOrCreateUser();

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      tournamentTeams: {
        orderBy: [
          { points: 'desc' },
          { wins: 'desc' },
          { matchesPlayed: 'asc' }
        ]
      },
      games: {
        orderBy: { createdAt: 'desc' },
        include: {
          teamA: true,
          teamB: true
        }
      },
      _count: {
        select: { players: true }
      }
    }
  });

  if (!tournament) notFound();

  const activeGames = tournament.games.filter(g => g.status === "IN_PROGRESS");
  const completedGames = tournament.games.filter(g => g.status === "COMPLETED").slice(0, 5);
  const scheduledGames = tournament.games.filter(g => g.status === "SCHEDULED").slice(0, 5);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10 border border-white/10 p-6 md:p-10">
        {tournament.thumbnailUrl && (
          <div className="absolute inset-0 z-0 opacity-20">
            <Image src={tournament.thumbnailUrl} alt={tournament.name} fill className="object-cover" />
          </div>
        )}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{tournament.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1 text-sm bg-white/5 px-2 py-1 rounded">
                <Calendar className="w-4 h-4" />
                {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'}
              </span>
              <span className="flex items-center gap-1 text-sm bg-white/5 px-2 py-1 rounded">
                <Users className="w-4 h-4" /> {tournament._count.players} Players
              </span>
              <Badge variant={tournament.isActive ? "default" : "secondary"}>
                {tournament.isActive ? "Active" : "Completed"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* COURTSIDE ACTION (Active Games) */}
      {activeGames.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-red-500 animate-pulse">
            <Activity className="w-6 h-6" /> Courtside Live
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeGames.map(game => (
              <Link key={game.id} href={`/tournament/${slug}/match/${game.id}`}>
                <Card className="glass-card hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                      <span className="text-xs text-muted-foreground font-mono">Round {game.round}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      {/* Team A */}
                      <div className="flex flex-col items-center gap-2 flex-1">
                        {game.teamA?.logoUrl ? (
                          <div className="w-12 h-12 relative rounded-full overflow-hidden border border-white/10">
                            <Image src={game.teamA.logoUrl} alt={game.teamA.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold">
                            {game.teamA?.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-sm text-center truncate w-full">{game.teamA?.name}</span>
                        <span className="text-3xl font-mono font-bold">{game.teamAScore}</span>
                      </div>

                      <div className="text-muted-foreground font-mono text-sm">VS</div>

                      {/* Team B */}
                      <div className="flex flex-col items-center gap-2 flex-1">
                        {game.teamB?.logoUrl ? (
                          <div className="w-12 h-12 relative rounded-full overflow-hidden border border-white/10">
                            <Image src={game.teamB.logoUrl} alt={game.teamB.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-lg font-bold">
                            {game.teamB?.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-sm text-center truncate w-full">{game.teamB?.name}</span>
                        <span className="text-3xl font-mono font-bold">{game.teamBScore}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: STANDINGS */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" /> Standings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-white/5 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Pos</th>
                      <th className="px-4 py-3">Team</th>
                      <th className="px-4 py-3 text-center">P</th>
                      <th className="px-4 py-3 text-center">W</th>
                      <th className="px-4 py-3 text-center">L</th>
                      <th className="px-4 py-3 text-center">D</th>
                      <th className="px-4 py-3 text-center font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tournament.tournamentTeams.map((team, index) => (
                      <tr key={team.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium text-muted-foreground">#{index + 1}</td>
                        <td className="px-4 py-3 font-semibold flex items-center gap-2">
                          {team.logoUrl && (
                            <div className="w-6 h-6 relative rounded-full overflow-hidden">
                              <Image src={team.logoUrl} alt={team.name} fill className="object-cover" />
                            </div>
                          )}
                          {team.name}
                        </td>
                        <td className="px-4 py-3 text-center">{team.matchesPlayed}</td>
                        <td className="px-4 py-3 text-center text-green-400">{team.wins}</td>
                        <td className="px-4 py-3 text-center text-red-400">{team.losses}</td>
                        <td className="px-4 py-3 text-center text-yellow-400">{team.draws}</td>
                        <td className="px-4 py-3 text-center font-bold text-lg">{team.points}</td>
                      </tr>
                    ))}
                    {tournament.tournamentTeams.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          No teams registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: OTHER GAMES */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PlayCircle className="w-4 h-4" /> Recent & Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...completedGames, ...scheduledGames].length === 0 ? (
                <p className="text-sm text-muted-foreground">No other matches.</p>
              ) : (
                [...completedGames, ...scheduledGames].map(game => (
                  <Link
                    key={game.id}
                    href={`/tournament/${slug}/match/${game.id}`}
                    className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  >
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-xs text-muted-foreground">Round {game.round}</span>
                      <Badge variant={game.status === "COMPLETED" ? "secondary" : "outline"} className="text-[10px] h-5">
                        {game.status === "COMPLETED" ? "Final" : "Scheduled"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center font-semibold">
                      <div className="flex items-center gap-2">
                        {game.teamA?.logoUrl && <div className="w-4 h-4 relative rounded-full overflow-hidden"><Image src={game.teamA.logoUrl} alt="" fill className="object-cover" /></div>}
                        <span>{game.teamA?.name}</span>
                      </div>
                      <span className="font-mono text-muted-foreground text-xs">vs</span>
                      <div className="flex items-center gap-2">
                        <span>{game.teamB?.name}</span>
                        {game.teamB?.logoUrl && <div className="w-4 h-4 relative rounded-full overflow-hidden"><Image src={game.teamB.logoUrl} alt="" fill className="object-cover" /></div>}
                      </div>
                    </div>
                    {game.status === "COMPLETED" && (
                      <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground px-1">
                        <span className="font-mono">{game.teamAScore}</span>
                        <span className="font-mono">{game.teamBScore}</span>
                      </div>
                    )}
                  </Link>
                ))
              )}
              <Link href={`/tournament/${slug}/schedule`}>
                <Button variant="outline" className="w-full mt-2" size="sm">View Full Schedule</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
