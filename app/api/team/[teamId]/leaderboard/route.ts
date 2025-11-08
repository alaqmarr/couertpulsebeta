import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  const { teamId } = params;

  const sessions = await prisma.session.findMany({
    where: { teamId },
    include: { games: true },
  });

  const tally = new Map<string, { plays: number; wins: number }>();

  for (const session of sessions) {
    for (const g of session.games) {
      const all = [...g.teamAPlayers, ...g.teamBPlayers];
      for (const p of all) {
        const rec = tally.get(p) || { plays: 0, wins: 0 };
        rec.plays += 1;
        if ((g.winner === "A" && g.teamAPlayers.includes(p)) ||
            (g.winner === "B" && g.teamBPlayers.includes(p))) rec.wins += 1;
        tally.set(p, rec);
      }
    }
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: { user: true },
  });

  const data = Array.from(tally.entries()).map(([email, val]) => {
    const member = members.find((m) => m.email === email);
    const name = member?.displayName || member?.user?.name || email.split("@")[0];
    const losses = val.plays - val.wins;
    const winRate = val.plays > 0 ? (val.wins / val.plays) * 100 : 0;
    return { id: member?.id ?? email, name, ...val, losses, winRate };
  });

  return NextResponse.json(data);
}
