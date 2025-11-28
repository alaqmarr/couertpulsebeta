import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncSessionData } from "@/lib/sync";

export async function GET(req: NextRequest) {
  // 1. Verify Cron Secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 2. Find active sessions (e.g., from today or yesterday)
    // For simplicity, let's sync sessions from the last 24 hours
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

    // 3. Sync each session
    const results = await Promise.all(
      activeSessions.map((session) => syncSessionData(session.id))
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      synced: successCount,
      failed: failCount,
    });
  } catch (error) {
    console.error("Cron sync error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
