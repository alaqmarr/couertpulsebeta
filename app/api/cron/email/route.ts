import { NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Verify cron secret if needed (optional for now)
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const result = await processEmailQueue();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Email cron error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
