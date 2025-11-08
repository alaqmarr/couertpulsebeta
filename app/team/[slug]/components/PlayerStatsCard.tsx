"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils"; // Assuming you have this from shadcn

interface PlayerStats {
  name: string;
  plays: number;
  wins: number;
  losses: number;
  winRate: number; // 0–100
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

export default function PlayerStatsCard({ player }: { player: PlayerStats }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (player.winRate / 100) * circumference;

  const colorClass = getWinRateColorClass(player.winRate);

  return (
    <Card className="bg-card/70 backdrop-blur-sm border border-primary/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
      <CardHeader className="items-center text-center pb-2">
        <CardTitle className="text-lg font-semibold">{player.name}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center text-center">
        {/* Circular Progress Indicator */}
        <div className={cn("relative w-28 h-28 mb-4", colorClass)}>
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
              stroke="currentColor" // Inherits color from parent (colorClass)
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
            <span className="text-2xl font-bold">
              {player.winRate.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="w-full flex justify-between text-sm mt-2">
          <div className="text-center px-1">
            <span className="text-xs text-muted-foreground">Played</span>
            <p className="font-bold text-foreground">{player.plays}</p>
          </div>
          <div className="text-center px-1">
            <span className="text-xs text-green-500">Wins</span>
            <p className="font-bold text-green-500">{player.wins}</p>
          </div>
          <div className="text-center px-1">
            <span className="text-xs text-red-500">Losses</span>
            <p className="font-bold text-red-500">{player.losses}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}