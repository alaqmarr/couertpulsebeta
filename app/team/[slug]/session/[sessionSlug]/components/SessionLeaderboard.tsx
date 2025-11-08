"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LeaderboardEntry {
  id: string;
  displayName: string;
  plays: number;
  wins: number;
  losses: number;
  winRate: number;
}

export default function SessionLeaderboard({ stats }: { stats: LeaderboardEntry[] }) {
  if (stats.length === 0)
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No games played yet. The leaderboard will appear once games are recorded.
          </p>
        </CardContent>
      </Card>
    );

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Session Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Plays</TableHead>
              <TableHead className="text-right">Wins</TableHead>
              <TableHead className="text-right">Losses</TableHead>
              <TableHead className="text-right">Win Rate %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.displayName}</TableCell>
                <TableCell className="text-right">{p.plays}</TableCell>
                <TableCell className="text-right">{p.wins}</TableCell>
                <TableCell className="text-right">{p.losses}</TableCell>
                <TableCell className="text-right">
                  {p.winRate.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
