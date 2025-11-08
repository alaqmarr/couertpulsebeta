"use client";

import { Card, CardContent } from "@/components/ui/card";

interface PlayerStats {
  name: string;
  plays: number;
  wins: number;
  losses: number;
  winRate: number; // 0–100
}

export default function PlayerStatsCard({ player }: { player: PlayerStats }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (player.winRate / 100) * circumference;

  return (
    <Card className="flex flex-col items-center justify-center p-6 shadow-sm border rounded-2xl bg-card hover:shadow-md transition-all">
      <CardContent className="flex flex-col items-center text-center">
        {/* Player Name */}
        <h3 className="text-lg font-semibold mb-2">{player.name}</h3>

        {/* Circular Progress Indicator */}
        <div className="relative w-28 h-28 mb-4">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Win Percentage Arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={player.winRate >= 50 ? "#22c55e" : "#ef4444"} // green / red
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s" }}
            />
          </svg>

          {/* Win Percentage Text */}
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <span
              className={`text-xl font-bold ${
                player.winRate >= 50
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {player.winRate.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Played:</span>{" "}
            {player.plays}
          </p>
          <p className="text-green-500 font-medium">
            Wins: {player.wins}
          </p>
          <p className="text-red-500 font-medium">
            Losses: {player.losses}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
