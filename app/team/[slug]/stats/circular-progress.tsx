"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  color?: string;
}

export function CircularProgress({
  value,
  size = 80,
  color = "text-green-500",
}: CircularProgressProps) {
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background Circle */}
        <circle
          className="text-muted/40"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Foreground Progress */}
        <circle
          className={cn("transition-all duration-500 ease-out", color)}
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <span className="absolute text-sm font-semibold">
        {Math.round(value)}%
      </span>
    </div>
  );
}
