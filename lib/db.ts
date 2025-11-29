import { PrismaClient } from "@/app/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "",
});

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

// Explicitly export commonly used types to avoid "export *" warning
export type {
  // Core Prisma types
  Prisma,
  PrismaPromise,

  // Models
  AppConfig,
  ClerkUser,
  User,
  Team,
  TeamMember,
  Session,
  SessionParticipant,
  Game,
  PairStat,
  SessionPairHistory,
  SessionPlayerStats,
  Tournament,
  TournamentMember,
  TournamentTeam,
  TournamentGame,
  MatchEvent,
  Stage,
  Payment,
  Notification,
  Activity,
  CalendarEvent,
  TournamentPlayer,
  TournamentPoint,
  TournamentEnrollment,
  EmailLog,
  VerificationToken,
} from "@/app/prisma";

// Export enums
export {
  PackageType,
  Role,
  WinningTeam,
  PaymentType,
  ActivityType,
  TournamentRole,
  GameStatus,
  EventType,
  EnrollmentStatus,
  PaymentMode,
} from "@/app/prisma";
