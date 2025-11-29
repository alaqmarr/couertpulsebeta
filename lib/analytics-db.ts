import { PrismaClient as AnalyticsPrismaClient } from "@/app/prisma-analytics";

// Analytics Database Client
const globalForAnalyticsPrisma = globalThis as unknown as {
  analyticsDb: AnalyticsPrismaClient | undefined;
};

export const analyticsDb =
  globalForAnalyticsPrisma.analyticsDb ??
  new AnalyticsPrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForAnalyticsPrisma.analyticsDb = analyticsDb;
}
