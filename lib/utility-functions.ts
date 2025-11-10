import { PromiseReturnType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PlayerFact } from "@/components/dashboard/PlayerIntelCard";
import {
  Lightbulb,
  Sparkles,
  Swords,
  Target,
  Trophy,
  User,
  Users,
  Zap,
} from "lucide-react";
import { toZonedTime } from "date-fns-tz";
import { SessionInfo } from "@/components/dashboard/UpcomingSessionCard";
export type PartnerStat = {
  partner: string;
  plays: number;
  wins: number;
  winRate: string;
};

export function getWinRateColorClass(winRate: number): string {
  if (winRate < 20) return "text-red-500";
  if (winRate < 40) return "text-red-400";
  if (winRate < 50) return "text-yellow-500";
  if (winRate < 60) return "text-yellow-400";
  if (winRate < 80) return "text-green-400";
  return "text-green-500";
}





export function findUpcomingOrRecentSession(
  allTeams: any[],
  timeZone: string
): SessionInfo {
  const now = new Date()
  const nowInKolkata = toZonedTime(now, timeZone)

  let allSessions: any[] = []
  for (const team of allTeams) {
    if (team.sessions) {
      for (const session of team.sessions) {
        allSessions.push({
          ...session,
          team: { name: team.name, slug: team.slug },
        })
      }
    }
  }
  // All sessions are already sorted ASC by date from Prisma

  // 1. Try to find an upcoming session
  const upcomingSessions = allSessions.filter(
    (s) => new Date(s.date) >= nowInKolkata
  )
  if (upcomingSessions.length > 0) {
    // The first one in the list is the next upcoming
    return { session: upcomingSessions[0], isUpcoming: true }
  }

  // 2. If no upcoming, find the most recent past session
  const pastSessions = allSessions.filter(
    (s) => new Date(s.date) < nowInKolkata
  )
  if (pastSessions.length > 0) {
    // The last one in the list is the most recent past
    return { session: pastSessions[pastSessions.length - 1], isUpcoming: false }
  }

  // 3. If no sessions at all
  return { session: null, isUpcoming: false }
}


export function generatePlayerFacts(
  stats: { totalWins: number; totalLosses: number; totalGames: number; winRate: string },
  teamStats: any[],
  partnerStats: PartnerStat[],
  userDisplay: string
): PlayerFact[] {

  const facts: PlayerFact[] = []
  const { totalWins, totalGames, winRate } = stats
  const numericWinRate = parseFloat(winRate)

  // === Fact 1: Milestone Facts ===
  if (totalGames > 50) {
    facts.push({
      icon: "Zap", // [CHANGED] Pass string name
      title: "Veteran Player",
      text: `You've competed in over ${totalGames} games! That's serious dedication.`,
    })
  } else if (totalGames > 20) {
    facts.push({
      icon: "Zap", // [CHANGED] Pass string name
      title: "Active Competitor",
      text: `With ${totalGames} games played, you're a regular on the court.`,
    })
  } else if (totalGames === 1) {
    facts.push({
      icon: "Sparkles", // [CHANGED] Pass string name
      title: "Welcome to the Game!",
      text: "You've completed your first game. This is just the beginning!",
    })
  }

  // === Fact 2: Win/Performance Facts ===
  if (totalWins > 25) {
    facts.push({
      icon: "Trophy", // [CHANGED] Pass string name
      title: "Winning Machine",
      text: `You've racked up an impressive ${totalWins} wins. Keep it up!`,
    })
  }

  if (numericWinRate > 65 && totalGames > 10) {
    facts.push({
      icon: "Target", // [CHANGED] Pass string name
      title: "Dominating the Court",
      text: `You're winning ${winRate}% of your games. Truly impressive!`,
    })
  } else if (numericWinRate < 40 && totalGames > 10) {
    facts.push({
      icon: "Lightbulb", // [CHANGED] Pass string name
      title: "Comeback Season",
      text: "Every game is a learning opportunity. Let's work on boosting that win rate!",
    })
  }

  // === Fact 3: Team Facts ===
  const bestTeam = [...teamStats]
    .filter((t) => t.plays > 5)
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0]

  if (bestTeam) {
    facts.push({
      icon: "Users", // [CHANGED] Pass string name
      title: "Your Strongest Team",
      text: `You're on fire with ${bestTeam.teamName}, boasting a ${bestTeam.winRate}% win rate!`,
    })
  }

  const mostPlayedTeam = [...teamStats]
    .sort((a, b) => b.plays - a.plays)[0]

  if (mostPlayedTeam && mostPlayedTeam.teamName !== bestTeam?.teamName) {
    facts.push({
      icon: "Users", // [CHANGED] Pass string name
      title: "Your Home Court",
      text: `You're a loyal member of ${mostPlayedTeam.teamName}, with ${mostPlayedTeam.plays} games played.`,
    })
  }

  // === Fact 4: Partner Facts ===
  const bestPartner = [...partnerStats]
    .filter((p) => p.plays > 5)
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))[0]

  if (bestPartner) {
    facts.push({
      icon: "Sparkles", // [CHANGED] Pass string name
      title: "Dynamic Duo",
      text: `You and ${bestPartner.partner} are a force, winning ${bestPartner.winRate}% of your ${bestPartner.plays} games!`,
    })
  }

  const mostPlayedPartner = [...partnerStats]
    .sort((a, b) => b.plays - a.plays)[0]

  if (mostPlayedPartner && mostPlayedPartner.partner !== bestPartner?.partner) {
    facts.push({
      icon: "Swords", // [CHANGED] Pass string name
      title: "Go-To Partner",
      text: `You've battled in ${mostPlayedPartner.plays} games with ${mostPlayedPartner.partner}. That's teamwork!`,
    })
  }

  if (partnerStats.length === 0 && totalGames > 5) {
    facts.push({
      icon: "User", // [CHANGED] Pass string name
      title: "The Lone Wolf",
      text: "You've played all your games solo or haven't recorded pair stats yet. Find a partner!",
    })
  }

  // === Fallback Fact ===
  if (facts.length === 0) {
    facts.push({
      icon: "Sparkles", // [CHANGED] Pass string name
      title: `Ready, ${userDisplay}?`,
      text: "Here's your intel. Track your stats, manage teams, and dominate the court.",
    })
  }

  return facts
}