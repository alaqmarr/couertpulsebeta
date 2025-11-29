import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getOrCreateUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      tournamentTeams: {
        include: {
          players: true,
        },
      },
      games: {
        include: {
          teamA: true,
          teamB: true,
        },
        orderBy: { createdAt: "desc" },
      },
      players: {
        include: {
          team: true,
        },
      },
      enrollments: true,
    },
  });

  if (!tournament) {
    return new NextResponse("Tournament not found", { status: 404 });
  }

  // Check permissions (Owner or Manager)
  const isOwner = tournament.ownerId === user.id;
  // We'd need to fetch members to check for manager, but for now let's restrict to owner or if we fetch members.
  // Let's assume owner for now or fetch members if needed.
  // For simplicity, let's just check owner for this export.
  if (!isOwner) {
    // Check if manager
    const member = await prisma.tournamentMember.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: tournament.id,
          userId: user.id,
        },
      },
    });
    if (!member || (member.role !== "MANAGER" && member.role !== "CO_OWNER")) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Prepare Data
  const wb = XLSX.utils.book_new();

  // 1. Teams Sheet
  const teamsData = tournament.tournamentTeams.map((team) => ({
    "Team Name": team.name,
    "Matches Played": team.matchesPlayed,
    Wins: team.wins,
    Losses: team.losses,
    Points: team.points,
    "Players Count": team.players.length,
  }));
  const teamsWs = XLSX.utils.json_to_sheet(teamsData);
  XLSX.utils.book_append_sheet(wb, teamsWs, "Teams");

  // 2. Players Sheet
  const playersData = tournament.players.map((player) => ({
    Name: player.name,
    Email: player.email || "N/A",
    Team: player.team?.name || "Unassigned",
    Matches: player.matchesPlayed,
    "Sold Price": player.soldPrice,
    Captain: player.isCaptain ? "Yes" : "No",
  }));
  const playersWs = XLSX.utils.json_to_sheet(playersData);
  XLSX.utils.book_append_sheet(wb, playersWs, "Players");

  // 3. Matches Sheet
  const matchesData = tournament.games.map((game) => ({
    "Match ID": game.id,
    Status: game.status,
    "Team A": game.teamA.name,
    "Team B": game.teamB.name,
    "Team A Score": game.teamAScore,
    "Team B Score": game.teamBScore,
    Winner: game.winningTeam || "N/A",
    Date: game.createdAt.toISOString().split("T")[0],
  }));
  const matchesWs = XLSX.utils.json_to_sheet(matchesData);
  XLSX.utils.book_append_sheet(wb, matchesWs, "Matches");

  // 4. Enrollments Sheet
  const enrollmentsData = tournament.enrollments.map((enrollment) => ({
    Name: enrollment.name,
    Email: enrollment.email,
    Mobile: enrollment.mobile,
    Status: enrollment.status,
    "Payment Mode": enrollment.paymentMode,
    "Transaction ID": enrollment.transactionId || "N/A",
    Date: enrollment.createdAt.toISOString().split("T")[0],
  }));
  const enrollmentsWs = XLSX.utils.json_to_sheet(enrollmentsData);
  XLSX.utils.book_append_sheet(wb, enrollmentsWs, "Enrollments");

  // Generate Buffer
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Disposition": `attachment; filename="${tournament.slug}-export.xlsx"`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
