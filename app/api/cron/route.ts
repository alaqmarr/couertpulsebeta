import { NextRequest, NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/scheduler";
import { prisma } from "@/lib/db";
import { syncSessionData } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const job = searchParams.get("job");
  const authHeader = request.headers.get("authorization");

  // Verify Cron Secret
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    switch (job) {
      case "email":
        return await handleEmailJob();
      case "sync":
        return await handleSyncJob();
      case "update-build-time":
        return await handleUpdateBuildTimeJob();
      default:
        return NextResponse.json(
          { error: "Invalid job specified" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error(`Cron job '${job}' error:`, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function handleEmailJob() {
  const result = await processEmailQueue();
  return NextResponse.json({
    success: true,
    job: "email",
    ...result,
  });
}

async function handleSyncJob() {
  // Sync sessions from the last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const activeSessions = await prisma.session.findMany({
    where: {
      date: {
        gte: yesterday,
      },
    },
    select: { id: true },
  });

  const results = await Promise.all(
    activeSessions.map((session) => syncSessionData(session.id))
  );

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  return NextResponse.json({
    success: true,
    job: "sync",
    synced: successCount,
    failed: failCount,
  });
}

async function handleUpdateBuildTimeJob() {
  const newBuildTime = new Date().toISOString();

  await prisma.appConfig.upsert({
    where: { key: "lastBuildTime" },
    update: {
      value: newBuildTime,
    },
    create: {
      key: "lastBuildTime",
      value: newBuildTime,
    },
  });

  return NextResponse.json({
    success: true,
    job: "update-build-time",
    message: "Build time updated successfully",
  });
}
