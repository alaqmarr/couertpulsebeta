import { PrismaClient as AnalyticsPrismaClient } from "@/app/prisma-analytics/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.ANALYTICS_DATABASE_URL || "",
});

const globalForAnalyticsPrisma = globalThis as unknown as {
  analyticsDb: AnalyticsPrismaClient | undefined;
};

export const analyticsDb =
  globalForAnalyticsPrisma.analyticsDb ??
  new AnalyticsPrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForAnalyticsPrisma.analyticsDb = analyticsDb;
}
