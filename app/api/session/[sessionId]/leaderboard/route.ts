import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        games: true,
        participants: {
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Map email to display name
    const playerMap = new Map<string, string>();
    session.participants.forEach((p) => {
      const name =
        p.member.displayName ||
        p.member.user?.name ||
        p.member.email.split("@")[0];
      playerMap.set(p.member.email, name);
    });

    // Calculate stats
    const stats = new Map<
      string,
      {
        plays: number;
        wins: number;
        losses: number;
        pointsWon: number;
        pointsLost: number;
      }
    >();

    session.games.forEach((game) => {
      if (!game.winner) return; // Skip unfinished games

      const players = [...game.teamAPlayers, ...game.teamBPlayers];
      const winners =
        game.winner === "A"
          ? game.teamAPlayers
          : game.winner === "B"
          ? game.teamBPlayers
          : [];

      players.forEach((email) => {
        if (!stats.has(email)) {
          stats.set(email, {
            plays: 0,
            wins: 0,
            losses: 0,
            pointsWon: 0,
            pointsLost: 0,
          });
        }
        const s = stats.get(email)!;
        s.plays += 1;

        // Points Calculation
        const isTeamA = game.teamAPlayers.includes(email);
        const myScore = isTeamA ? game.teamAScore || 0 : game.teamBScore || 0;
        const opponentScore = isTeamA
          ? game.teamBScore || 0
          : game.teamAScore || 0;

        s.pointsWon += myScore;
        s.pointsLost += opponentScore;

        if (game.winner !== "DRAW") {
          if (winners.includes(email)) {
            s.wins += 1;
          } else {
            s.losses += 1;
          }
        }
      });
    });

    // Format for response
    const leaderboard = Array.from(stats.entries()).map(([email, s]) => {
      const winRate = s.plays > 0 ? (s.wins / s.plays) * 100 : 0;
      const pointsDiff = s.pointsWon - s.pointsLost;
      return {
        id: email, // Using email as ID for the table key
        displayName: playerMap.get(email) || email.split("@")[0],
        plays: s.plays,
        wins: s.wins,
        losses: s.losses,
        winRate,
        pointsDiff,
      };
    });

    // Sort by Win Rate (desc), then Wins (desc)
    leaderboard.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.wins - a.wins;
    });

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
