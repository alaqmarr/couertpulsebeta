"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CircularProgress } from "@/components/ui/circular-progress";
import { toast } from "react-hot-toast";

interface PlayerStats {
  id: string;
  name: string;
  plays: number;
  wins: number;
  losses: number;
  winRate: number;
}

export default function TeamLeaderboard({ teamId }: { teamId: string }) {
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<PlayerStats[]>([]);

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/team/${teamId}/leaderboard`);
        const data = await res.json();
        setStats(data);
      } catch {
        toast.error("Failed to load leaderboard.");
      }
    });
  }, [teamId]);

  if (isPending && stats.length === 0)
    return (
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Overall Team Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading stats…</p>
        </CardContent>
      </Card>
    );

  return (
    <Card className="mt-10">
      <CardHeader>
        <CardTitle>Overall Team Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Plays</TableHead>
                <TableHead className="text-right">Wins</TableHead>
                <TableHead className="text-right">Losses</TableHead>
                <TableHead className="text-right">Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-right">{p.plays}</TableCell>
                  <TableCell className="text-right">{p.wins}</TableCell>
                  <TableCell className="text-right">{p.losses}</TableCell>
                  <TableCell className="text-right">
                    <CircularProgress value={p.winRate} size={44} strokeWidth={5} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
