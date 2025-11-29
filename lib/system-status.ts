"use server";

import { prisma } from "@/lib/db";
import { analyticsDb } from "@/lib/analytics-db";
import { primaryDatabase, analyticsDatabase } from "@/lib/firebase-admin";

export type DatabaseStatus = {
  name: string;
  type: "postgresql" | "firebase";
  status: "healthy" | "degraded" | "down";
  responseTime?: number;
  error?: string;
  details?: {
    recordCount?: number;
    lastActivity?: Date;
  };
};

/**
 * Check Primary PostgreSQL Database
 */
async function checkPrimaryPostgres(): Promise<DatabaseStatus> {
  const start = Date.now();
  try {
    // Simple query to check connection
    const userCount = await prisma.user.count();
    const responseTime = Date.now() - start;

    // Get last activity
    const lastUser = await prisma.user.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    return {
      name: "Primary PostgreSQL",
      type: "postgresql",
      status: responseTime < 1000 ? "healthy" : "degraded",
      responseTime,
      details: {
        recordCount: userCount,
        lastActivity: lastUser?.createdAt,
      },
    };
  } catch (error: any) {
    return {
      name: "Primary PostgreSQL",
      type: "postgresql",
      status: "down",
      responseTime: Date.now() - start,
      error: error.message,
    };
  }
}

/**
 * Check Analytics PostgreSQL Database
 */
async function checkAnalyticsPostgres(): Promise<DatabaseStatus> {
  const start = Date.now();
  try {
    const activityCount = await analyticsDb.activity.count();
    const achievementCount = await analyticsDb.achievement.count();
    const responseTime = Date.now() - start;

    const lastActivity = await analyticsDb.activity.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    return {
      name: "Analytics PostgreSQL",
      type: "postgresql",
      status: responseTime < 1000 ? "healthy" : "degraded",
      responseTime,
      details: {
        recordCount: activityCount + achievementCount,
        lastActivity: lastActivity?.createdAt,
      },
    };
  } catch (error: any) {
    return {
      name: "Analytics PostgreSQL",
      type: "postgresql",
      status: "down",
      responseTime: Date.now() - start,
      error: error.message,
    };
  }
}

/**
 * Check Primary Firebase Database
 */
async function checkPrimaryFirebase(): Promise<DatabaseStatus> {
  const start = Date.now();
  try {
    // Test connection by reading a reference
    const testRef = primaryDatabase.ref("/.info/connected");
    await testRef.once("value");
    const responseTime = Date.now() - start;

    return {
      name: "Primary Firebase (courtpulse-beta)",
      type: "firebase",
      status: responseTime < 1000 ? "healthy" : "degraded",
      responseTime,
    };
  } catch (error: any) {
    return {
      name: "Primary Firebase (courtpulse-beta)",
      type: "firebase",
      status: "down",
      responseTime: Date.now() - start,
      error: error.message,
    };
  }
}

/**
 * Check Analytics Firebase Database
 */
async function checkAnalyticsFirebase(): Promise<DatabaseStatus> {
  const start = Date.now();
  try {
    const testRef = analyticsDatabase.ref("/.info/connected");
    await testRef.once("value");
    const responseTime = Date.now() - start;

    return {
      name: "Analytics Firebase (courtpulse-prod2)",
      type: "firebase",
      status: responseTime < 1000 ? "healthy" : "degraded",
      responseTime,
    };
  } catch (error: any) {
    return {
      name: "Analytics Firebase (courtpulse-prod2)",
      type: "firebase",
      status: "down",
      responseTime: Date.now() - start,
      error: error.message,
    };
  }
}

/**
 * Get status of all databases
 */
export async function getSystemStatus(): Promise<DatabaseStatus[]> {
  const [primaryPg, analyticsPg, primaryFb, analyticsFb] =
    await Promise.allSettled([
      checkPrimaryPostgres(),
      checkAnalyticsPostgres(),
      checkPrimaryFirebase(),
      checkAnalyticsFirebase(),
    ]);

  return [
    primaryPg.status === "fulfilled"
      ? primaryPg.value
      : {
          name: "Primary PostgreSQL",
          type: "postgresql" as const,
          status: "down" as const,
          error: "Check failed",
        },
    analyticsPg.status === "fulfilled"
      ? analyticsPg.value
      : {
          name: "Analytics PostgreSQL",
          type: "postgresql" as const,
          status: "down" as const,
          error: "Check failed",
        },
    primaryFb.status === "fulfilled"
      ? primaryFb.value
      : {
          name: "Primary Firebase",
          type: "firebase" as const,
          status: "down" as const,
          error: "Check failed",
        },
    analyticsFb.status === "fulfilled"
      ? analyticsFb.value
      : {
          name: "Analytics Firebase",
          type: "firebase" as const,
          status: "down" as const,
          error: "Check failed",
        },
  ];
}
