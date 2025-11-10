import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // 1. Check for the secret
  if (secret !== process.env.CRON_SECRET) {
    return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. If secret is valid, update the build time
  try {
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

    // 3. Return a success response
    return new NextResponse(
      JSON.stringify({ message: "Build time updated successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating build time:", error);
    return new NextResponse(
      JSON.stringify({ message: "Error updating build time" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
