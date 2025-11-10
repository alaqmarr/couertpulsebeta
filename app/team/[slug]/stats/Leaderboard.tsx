import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils"; // Assuming you have this
import { Trophy, Info, Medal } from "lucide-react";

/**
 * Helper function to determine Tailwind color class based on win rate.
 */
function getWinRateColorClass(winRate: number): string {
  if (winRate < 20) return "text-red-500";
  if (winRate < 40) return "text-red-400";
  if (winRate < 50) return "text-yellow-500";
  if (winRate < 60) return "text-yellow-400";
  if (winRate < 80) return "text-green-400";
  return "text-green-500";
}

/**
 * Computes and displays a team's overall leaderboard.
 * Aggregates all sessions and games for every player in the team.
 */
export default async function TeamLeaderboard({ teamId }: { teamId: string }) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { include: { user: true } },
      sessions: { include: { games: true } },
    },
  });

  if (!team) return null;

  // Aggregate statistics (logic is unchanged, it's solid)
  const playerStats = new Map<
    string,
    { plays: number; wins: number; losses: number; name: string }
  >();

  for (const session of team.sessions) {
    for (const game of session.games) {
      const all = [...game.teamAPlayers, ...game.teamBPlayers];
      for (const email of all) {
        const stat =
          playerStats.get(email) ?? { plays: 0, wins: 0, losses: 0, name: email };
        stat.plays++;
        const won =
          (game.winner === "A" && game.teamAPlayers.includes(email)) ||
          (game.winner === "B" && game.teamBPlayers.includes(email));
        if (won) stat.wins++;
        else stat.losses++;
        playerStats.set(email, stat);
      }
    }
  }

  const leaderboard = Array.from(playerStats.entries())
    .map(([email, s]) => {
      const member = team.members.find((m) => m.email === email);
      const displayName =
        member?.displayName ||
        member?.user?.name ||
        email.split("@")[0] ||
        "Unnamed Player";
      const winRate = s.plays > 0 ? (s.wins / s.plays) * 100 : 0;
      return {
        id: email,
        name: displayName,
        plays: s.plays,
        wins: s.wins,
        losses: s.losses,
        winRate,
      };
    })
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

  // --- Refactored Empty State ---
  if (leaderboard.length === 0)
    return (
      <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy size={18} />
            Team Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-muted/50">
            <Info size={24} className="text-primary" />
            <p className="text-muted-foreground text-sm">
              No games have been played yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );

  // --- Refactored Main Component ---
  return (
    <Card className="bg-card/70 backdrop-blur-sm border border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy size={18} />
          Team Leaderboard
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] px-2">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">M</TableHead>
                <TableHead className="text-right">W</TableHead>
                <TableHead className="text-right">L</TableHead>
                <TableHead className="text-right">W %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((player, i) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium px-2">
                    {i === 0 ? (
                      <Medal className="w-5 h-5 text-yellow-500" />
                    ) : (
                      i + 1
                    )}
                  </TableCell>
                  <TableCell className="font-medium truncate max-w-xs">
                    {player.name}
                  </TableCell>
                  <TableCell className="text-right">{player.plays}</TableCell>
                  <TableCell className="text-right font-medium text-green-500">
                    {player.wins}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-500">
                    {player.losses}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-bold",
                      getWinRateColorClass(player.winRate)
                    )}
                  >
                    {player.winRate.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}