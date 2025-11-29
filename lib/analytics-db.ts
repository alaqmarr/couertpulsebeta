import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient as AnalyticsPrismaClient } from "../app/prisma-analytics";

const connectionString = `${process.env.ANALYTICS_DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Analytics Database Client
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
