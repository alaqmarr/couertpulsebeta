"use client";

import { cn } from "@/lib/utils";

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
    <div className="glass-card rounded-xl border-primary/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
      <div className="p-6 flex flex-col items-center">
        <div className="text-lg font-semibold mb-2 text-center">{player.name}</div>

        <div className="flex flex-col items-center text-center w-full">
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
                className="opacity-20"
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
          <div className="w-full flex justify-between text-sm mt-2 px-2">
            <div className="text-center px-1">
              <span className="text-xs text-muted-foreground block">Played</span>
              <p className="font-bold text-foreground">{player.plays}</p>
            </div>
            <div className="text-center px-1">
              <span className="text-xs text-green-500 block">Wins</span>
              <p className="font-bold text-green-500">{player.wins}</p>
            </div>
            <div className="text-center px-1">
              <span className="text-xs text-red-500 block">Losses</span>
              <p className="font-bold text-red-500">{player.losses}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
