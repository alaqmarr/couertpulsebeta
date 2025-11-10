'use client'

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Clock, RefreshCw, Zap } from "lucide-react"
import { add } from "date-fns"
import { revalidateDashboard } from "@/app/data-freshness.server"

/**
 * Pads a number with a leading zero if it's less than 10.
 */
function pad(num: number) {
  return num < 10 ? `0${num}` : num
}

export function DataFreshnessAlert({
  buildTime,
  packageType,
}: {
  buildTime: string
  packageType: string
}) {
  const [isPending, startTransition] = useTransition()
  const [remainingTime, setRemainingTime] = useState("...")
  const [progress, setProgress] = useState(0)

  const isProUser = packageType !== 'FREE'

  useEffect(() => {
    const buildDate = new Date(buildTime)
    const nextUpdateDate = add(buildDate, { hours: 24 })
    const totalDuration = 24 * 60 * 60 * 1000 // 24 hours in ms

    const updateTimer = () => {
      const now = new Date()
      const diffMs = Math.max(0, nextUpdateDate.getTime() - now.getTime())
      
      // --- Calculate Time ---
      const totalSeconds = Math.floor(diffMs / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      setRemainingTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`)

      // --- Calculate Progress ---
      const elapsed = totalDuration - diffMs
      const progressPercent = Math.min(100, (elapsed / totalDuration) * 100)
      setProgress(progressPercent)
    }

    // Set the initial value
    updateTimer()

    // Update the timer every second
    const interval = setInterval(updateTimer, 1000)

    // Clean up the interval on component unmount
    return () => clearInterval(interval)
  }, [buildTime])

  const handleRefresh = () => {
    startTransition(() => {
      revalidateDashboard()
    })
  }

  // --- SVG Circular Progress Bar Props ---
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <Alert className="rounded-lg bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-border/50 shadow-lg">
      <Clock className="h-4 w-4 text-primary" />
      <AlertTitle className="font-semibold text-foreground">Data Freshness</AlertTitle>
      <AlertDescription className="text-muted-foreground mb-4">
        Dashboard data is cached and refreshes automatically.
      </AlertDescription>

      {/* --- Refined Features --- */}
      <div className="flex items-center justify-between gap-4">
        
        {/* Circular Progress & Timer */}
        <div className="relative h-20 w-20 flex-shrink-0">
          <svg className="h-full w-full" viewBox="0 0 80 80">
            {/* Track */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="transparent"
              stroke="var(--color-muted)"
              strokeWidth="5"
            />
            {/* Progress */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="transparent"
              stroke="var(--color-primary)"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              className="transition-all duration-500"
            />
          </svg>
          {/* Countdown Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-foreground">
              {remainingTime}
            </span>
          </div>
        </div>
        
        {/* Action Button (aligned to the right) */}
        <div className="flex-grow flex justify-end">
          {isProUser ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              {isPending ? "Refreshing..." : "Refresh Now"}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-accent/40"
              asChild
            >
              <Link href="/packages">
                <Zap className="mr-2 h-4 w-4" /> 
                Upgrade
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Alert>
  )
}