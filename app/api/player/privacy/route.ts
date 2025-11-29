import { NextRequest, NextResponse } from "next/server";
import { updatePlayerPrivacy } from "@/lib/player-privacy";

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();
    await updatePlayerPrivacy(settings);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update privacy settings" },
      { status: 500 }
    );
  }
}
