"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TeamStats = {
  teamName: string;
  plays: number;
  wins: number;
};

export default function WinRateChart({ stats }: { stats: TeamStats[] }) {
  if (!stats || stats.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Performance Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          No game data available yet.
        </CardContent>
      </Card>
    );
  }

  const data = stats.map((s) => ({
    name: s.teamName,
    winRate:
      s.plays > 0 ? parseFloat(((s.wins / s.plays) * 100).toFixed(1)) : 0,
    plays: s.plays,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          interval={0}
          angle={-10}
          textAnchor="end"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          domain={[0, 100]}
          label={{
            value: "Win Rate (%)",
            angle: -90,
            position: "insideLeft",
            fontSize: 12,
          }}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.05)" }}
          formatter={(val: number) => `${val.toFixed(1)}%`}
        />
        <Legend />
        <Bar
          dataKey="winRate"
          fill="hsl(var(--primary))"
          radius={[6, 6, 0, 0]}
          maxBarSize={60}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
