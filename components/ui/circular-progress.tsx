"use client";

import * as React from "react";

interface CircularProgressProps {
  value: number; // 0–100
  size?: number; // in px
  strokeWidth?: number;
  className?: string;
  label?: boolean; // whether to show numeric value in center
}

/**
 * A minimalist circular progress indicator matching shadcn/ui style.
 * Works with Tailwind dark/light themes.
 */
export function CircularProgress({
  value,
  size = 64,
  strokeWidth = 6,
  className = "",
  label = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="rotate-[-90deg] transform"
        aria-label="progress"
      >
        <circle
          stroke="hsl(var(--muted-foreground))"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="opacity-20"
        />
        <circle
          stroke="hsl(var(--primary))"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {label && (
        <span className="absolute text-xs font-medium text-foreground">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
