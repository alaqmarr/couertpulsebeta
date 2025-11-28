"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { EmailTemplates } from "@/lib/email-templates";
import { WinningTeam } from "@/app/prisma";

const createTournamentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  matchDays: z.string().optional(), // Comma separated days
  courts: z.coerce.number().min(1, "Must have at least 1 court"),
  auctionPurse: z.coerce.number().min(1000, "Purse must be at least 1000"),
  minGamesPerPlayer: z.coerce.number().min(0),
});

export async function createTournamentAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const rawData = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    matchDays: formData.get("matchDays"),
    courts: formData.get("courts"),
    auctionPurse: formData.get("auctionPurse"),
    minGamesPerPlayer: formData.get("minGamesPerPlayer"),
  };

  const validated = createTournamentSchema.parse(rawData);

  const matchDaysArray = validated.matchDays
    ? validated.matchDays.split(",").map((d) => d.trim())
    : [];

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        ownerId: user.id,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        matchDays: matchDaysArray,
        courts: validated.courts,
        auctionPurse: validated.auctionPurse,
        minGamesPerPlayer: validated.minGamesPerPlayer,
        members: {
          create: {
            userId: user.id,
            role: "MANAGER", // Creator is automatically a Manager
          },
        },
      },
    });

    return { success: true, slug: tournament.slug };
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("A tournament with this slug already exists.");
    }
    throw error;
  }
}

export async function addTournamentMemberAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as any;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions
  const isManager = tournament.members.some(
    (m) => m.userId === user.id && m.role === "MANAGER"
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  // Find target user or create placeholder
  let targetUser = await prisma.user.findUnique({ where: { email } });

  if (!targetUser) {
    // Create placeholder user
    targetUser = await prisma.user.create({
      data: {
        email,
        name: email.split("@")[0], // Default name from email
      },
    });
  }

  await prisma.tournamentMember.create({
    data: {
      tournamentId: tournament.id,
      userId: targetUser.id,
      role: role,
    },
  });

  revalidatePath(`/tournament/${slug}/settings`);
}

export async function removeTournamentMemberAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const memberId = formData.get("memberId") as string;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions
  const isManager = tournament.members.some(
    (m) => m.userId === user.id && m.role === "MANAGER"
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  await prisma.tournamentMember.delete({
    where: { id: memberId },
  });

  revalidatePath(`/tournament/${slug}/settings`);
}

export async function addTournamentPlayerAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Try to find user if email provided
  let userId = null;
  if (email) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) userId = u.id;
  }

  await prisma.tournamentPlayer.create({
    data: {
      tournamentId: tournament.id,
      name,
      email,
      userId,
    },
  });

  revalidatePath(`/tournament/${slug}/teams`);
}

export async function sellPlayerAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const playerId = formData.get("playerId") as string;
  const teamId = formData.get("teamId") as string;
  const price = Number(formData.get("price"));

  if (!playerId || !teamId || isNaN(price)) {
    throw new Error("Invalid input");
  }

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      members: true,
      tournamentTeams: true,
    },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions
  const isManager = tournament.members.some(
    (m) =>
      m.userId === user.id && (m.role === "MANAGER" || m.role === "AUCTIONEER")
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  // Check team purse
  const team = tournament.tournamentTeams.find((t) => t.id === teamId);
  if (!team) throw new Error("Team not found");

  if (team.purseSpent + price > tournament.auctionPurse) {
    throw new Error("Insufficient funds in team purse");
  }

  // Execute Transaction
  await prisma.$transaction([
    // Update Player
    prisma.tournamentPlayer.update({
      where: { id: playerId },
      data: {
        teamId: teamId,
        soldPrice: price,
      },
    }),
    // Update Team Purse
    prisma.tournamentTeam.update({
      where: { id: teamId },
      data: {
        purseSpent: { increment: price },
      },
    }),
  ]);

  revalidatePath(`/tournament/${slug}/auction`);
  revalidatePath(`/tournament/${slug}/teams`);
}

export async function toggleCustomStatsAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const enabled = formData.get("enabled") === "true";

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions (Only Owner/Manager)
  const isManager = tournament.members.some(
    (m) => m.userId === user.id && m.role === "MANAGER"
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  await prisma.tournament.update({
    where: { slug },
    data: { useCustomStats: enabled },
  });

  revalidatePath(`/tournament/${slug}/settings`);
  revalidatePath(`/tournament/${slug}/teams`);
}

export async function updatePlayerCustomStatsAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const playerId = formData.get("playerId") as string;
  const rating = Number(formData.get("rating"));
  const matches = Number(formData.get("matches"));
  const wins = Number(formData.get("wins"));

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions
  const isManager = tournament.members.some(
    (m) => m.userId === user.id && m.role === "MANAGER"
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  await prisma.tournamentPlayer.update({
    where: { id: playerId },
    data: {
      customRating: rating,
      customMatches: matches,
      customWins: wins,
    },
  });

  revalidatePath(`/tournament/${slug}/teams`);
}

export async function updateMatchScoreAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const matchId = formData.get("matchId") as string;
  const teamId = formData.get("teamId") as string;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions
  const isManager = tournament.members.some(
    (m) =>
      m.userId === user.id && (m.role === "MANAGER" || m.role === "REFEREE")
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  const match = await prisma.tournamentGame.findUnique({
    where: { id: matchId },
  });
  if (!match || match.status === "COMPLETED") throw new Error("Invalid match");

  const isTeamA = match.teamAId === teamId;

  await prisma.$transaction([
    prisma.tournamentGame.update({
      where: { id: matchId },
      data: {
        teamAScore: isTeamA ? { increment: 1 } : undefined,
        teamBScore: !isTeamA ? { increment: 1 } : undefined,
        status: "IN_PROGRESS",
      },
    }),
    prisma.tournamentPoint.create({
      data: {
        gameId: matchId,
        tournamentTeamId: teamId,
        pointType: "SCORE",
      },
    }),
  ]);

  revalidatePath(`/tournament/${slug}/match/${matchId}`);
  revalidatePath(`/tournament/${slug}`);
}

export async function endMatchAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const matchId = formData.get("matchId") as string;

  const match = await prisma.tournamentGame.findUnique({
    where: { id: matchId },
    include: { tournament: { include: { members: true } } },
  });

  if (!match) throw new Error("Match not found");

  // Check permissions
  const isManager = match.tournament.members.some(
    (m) =>
      m.userId === user.id && (m.role === "MANAGER" || m.role === "REFEREE")
  );
  if (match.tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  const teamAScore = match.teamAScore;
  const teamBScore = match.teamBScore;

  let winningTeam: WinningTeam = WinningTeam.DRAW;
  if (teamAScore > teamBScore) winningTeam = WinningTeam.A;
  else if (teamBScore > teamAScore) winningTeam = WinningTeam.B;

  await prisma.$transaction([
    // Update Match
    prisma.tournamentGame.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        winningTeam,
      },
    }),
    // Update Team A Stats
    prisma.tournamentTeam.update({
      where: { id: match.teamAId },
      data: {
        matchesPlayed: { increment: 1 },
        wins: winningTeam === WinningTeam.A ? { increment: 1 } : undefined,
        losses: winningTeam === WinningTeam.B ? { increment: 1 } : undefined,
        draws: winningTeam === WinningTeam.DRAW ? { increment: 1 } : undefined,
        points: {
          increment:
            winningTeam === WinningTeam.A
              ? 3
              : winningTeam === WinningTeam.DRAW
              ? 1
              : 0,
        },
      },
    }),
    // Update Team B Stats
    prisma.tournamentTeam.update({
      where: { id: match.teamBId },
      data: {
        matchesPlayed: { increment: 1 },
        wins: winningTeam === WinningTeam.B ? { increment: 1 } : undefined,
        losses: winningTeam === WinningTeam.A ? { increment: 1 } : undefined,
        draws: winningTeam === WinningTeam.DRAW ? { increment: 1 } : undefined,
        points: {
          increment:
            winningTeam === WinningTeam.B
              ? 3
              : winningTeam === WinningTeam.DRAW
              ? 1
              : 0,
        },
      },
    }),
  ]);

  revalidatePath(`/tournament/${match.tournament.slug}/match/${matchId}`);
  revalidatePath(`/tournament/${match.tournament.slug}`);
}

export async function createTournamentTeamAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const logoUrl = formData.get("logoUrl") as string;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions
  const isManager = tournament.members.some(
    (m) => m.userId === user.id && m.role === "MANAGER"
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  await prisma.tournamentTeam.create({
    data: {
      tournamentId: tournament.id,
      name,
      color: color || "#000000",
      logoUrl,
    },
  });

  revalidatePath(`/tournament/${slug}/teams`);
}

export async function updateTournamentSettingsAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const thumbnailUrl = formData.get("thumbnailUrl") as string;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions
  const isManager = tournament.members.some(
    (m) => m.userId === user.id && m.role === "MANAGER"
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  await prisma.tournament.update({
    where: { slug },
    data: {
      thumbnailUrl: thumbnailUrl || null,
    },
  });

  revalidatePath(`/tournament/${slug}/settings`);
  revalidatePath(`/tournament/${slug}`);
}

export async function generateScheduleAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      members: true,
      tournamentTeams: true,
    },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions
  const isManager = tournament.members.some(
    (m) => m.userId === user.id && m.role === "MANAGER"
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  // Simple Round Robin Scheduler
  const teams = tournament.tournamentTeams;
  if (teams.length < 2) throw new Error("Need at least 2 teams to schedule");

  const games = [];
  const numTeams = teams.length;
  // For single round robin
  // const numRounds = numTeams - 1;

  const teamIds = teams.map((t) => t.id);
  // If odd number of teams, add a dummy team for bye
  if (numTeams % 2 !== 0) {
    teamIds.push("BYE");
  }

  const finalTeamIds = [...teamIds];
  const totalRounds = finalTeamIds.length - 1;
  const matchesPerRound = finalTeamIds.length / 2;

  for (let round = 0; round < totalRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = finalTeamIds[match];
      const away = finalTeamIds[finalTeamIds.length - 1 - match];

      if (home !== "BYE" && away !== "BYE") {
        games.push({
          tournamentId: tournament.id,
          teamAId: home,
          teamBId: away,
          round: round + 1,
          status: "SCHEDULED" as const,
        });
      }
    }
    // Rotate teams for next round (keep first team fixed)
    finalTeamIds.splice(1, 0, finalTeamIds.pop()!);
  }

  // Batch create games
  await prisma.tournamentGame.createMany({
    data: games,
  });

  revalidatePath(`/tournament/${slug}/schedule`);
  revalidatePath(`/tournament/${slug}`);
}

export async function updateTournamentSetupAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const rules = formData.get("rules") as string;
  const contactPhone = formData.get("contactPhone") as string;
  const entryFee = Number(formData.get("entryFee"));
  const paymentUpi = formData.get("paymentUpi") as string;
  const paymentQrCode = formData.get("paymentQrCode") as string;
  const cashContactName = formData.get("cashContactName") as string;
  const cashContactNumber = formData.get("cashContactNumber") as string;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions
  const isManager = tournament.members.some(
    (m) =>
      m.userId === user.id && (m.role === "MANAGER" || m.role === "CO_OWNER")
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  await prisma.tournament.update({
    where: { slug },
    data: {
      description,
      rules,
      contactPhone,
      entryFee,
      paymentUpi,
      paymentQrCode,
      cashContactName,
      cashContactNumber,
    },
  });

  revalidatePath(`/tournament/${slug}/setup`);
  revalidatePath(`/tournament/${slug}/enroll`);
}

export async function enrollInTournamentAction(formData: FormData) {
  // Public action, no auth required for initial submission
  const slug = formData.get("slug") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const mobile = formData.get("mobile") as string;
  const paymentMode = formData.get("paymentMode") as "ONLINE" | "CASH";
  const paymentScreenshotUrl = formData.get("paymentScreenshotUrl") as string;
  const transactionId = formData.get("transactionId") as string;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Basic validation
  if (!name || !email || !mobile) {
    throw new Error("Missing required fields");
  }

  if (paymentMode === "ONLINE" && !paymentScreenshotUrl) {
    throw new Error("Payment screenshot is required for online payment");
  }

  // Check if already enrolled
  const existing = await prisma.tournamentEnrollment.findFirst({
    where: {
      tournamentId: tournament.id,
      email,
    },
  });

  if (existing) {
    throw new Error("You have already enrolled in this tournament.");
  }

  // Try to link to existing user if possible
  const existingUser = await prisma.user.findUnique({ where: { email } });

  await prisma.tournamentEnrollment.create({
    data: {
      tournamentId: tournament.id,
      userId: existingUser?.id,
      name,
      email,
      mobile,
      paymentMode,
      paymentScreenshotUrl,
      transactionId: transactionId || null,
      status: "PENDING",
    },
  });

  // Send Email Notification
  try {
    const html = EmailTemplates.EnrollmentReceived(name, tournament.name);
    const emailResult = await sendEmail({
      to: email,
      subject: `Enrollment Received: ${tournament.name}`,
      html,
    });

    await prisma.emailLog.create({
      data: {
        recipient: email,
        subject: `Enrollment Received: ${tournament.name}`,
        body: html,
        status: emailResult.success ? "SENT" : "FAILED",
        error: emailResult.error ? JSON.stringify(emailResult.error) : null,
        sentAt: emailResult.success ? new Date() : null,
      },
    });
  } catch (err) {
    console.error("Failed to send enrollment email:", err);
  }

  return { success: true };
}

export async function approveEnrollmentAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const enrollmentId = formData.get("enrollmentId") as string;
  const action = formData.get("action") as "APPROVE" | "REJECT";
  const adminNotes = formData.get("adminNotes") as string;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions
  const isManager = tournament.members.some(
    (m) =>
      m.userId === user.id && (m.role === "MANAGER" || m.role === "CO_OWNER")
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  const enrollment = await prisma.tournamentEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { tournament: true },
  });

  if (!enrollment) throw new Error("Enrollment not found");

  if (action === "REJECT") {
    await prisma.tournamentEnrollment.update({
      where: { id: enrollmentId },
      data: { status: "REJECTED", adminNotes },
    });

    // Send Rejection Email
    try {
      const html = EmailTemplates.EnrollmentRejected(
        enrollment.name,
        enrollment.tournament.name,
        adminNotes
      );
      const emailResult = await sendEmail({
        to: enrollment.email,
        subject: `Enrollment Rejected: ${enrollment.tournament.name}`,
        html,
      });

      await prisma.emailLog.create({
        data: {
          recipient: enrollment.email,
          subject: `Enrollment Rejected: ${enrollment.tournament.name}`,
          body: html,
          status: emailResult.success ? "SENT" : "FAILED",
          error: emailResult.error ? JSON.stringify(emailResult.error) : null,
          sentAt: emailResult.success ? new Date() : null,
        },
      });
    } catch (err) {
      console.error("Failed to send rejection email:", err);
    }
  } else {
    // APPROVE
    await prisma.$transaction(async (tx) => {
      // 1. Update Enrollment
      await tx.tournamentEnrollment.update({
        where: { id: enrollmentId },
        data: { status: "APPROVED", adminNotes },
      });

      // 2. Create Tournament Player
      // Check if player already exists
      const existingPlayer = await tx.tournamentPlayer.findFirst({
        where: {
          tournamentId: tournament.id,
          email: enrollment.email,
        },
      });

      if (!existingPlayer) {
        await tx.tournamentPlayer.create({
          data: {
            tournamentId: tournament.id,
            name: enrollment.name,
            email: enrollment.email,
            userId: enrollment.userId,
            // mobile: enrollment.mobile, // If we add mobile to player model later
          },
        });
      }
    });

    // Send Approval Email (Outside transaction to avoid blocking)
    try {
      const html = EmailTemplates.EnrollmentApproved(
        enrollment.name,
        enrollment.tournament.name
      );
      const emailResult = await sendEmail({
        to: enrollment.email,
        subject: `Enrollment Approved: ${enrollment.tournament.name}`,
        html,
      });

      await prisma.emailLog.create({
        data: {
          recipient: enrollment.email,
          subject: `Enrollment Approved: ${enrollment.tournament.name}`,
          body: html,
          status: emailResult.success ? "SENT" : "FAILED",
          error: emailResult.error ? JSON.stringify(emailResult.error) : null,
          sentAt: emailResult.success ? new Date() : null,
        },
      });
    } catch (err) {
      console.error("Failed to send approval email:", err);
    }
  }

  revalidatePath(`/tournament/${enrollment.tournament.slug}/enrollments`);
}

export async function bulkApproveEnrollmentsAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const enrollmentIds = (formData.get("enrollmentIds") as string).split(",");

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions
  const isManager = tournament.members.some(
    (m) =>
      m.userId === user.id && (m.role === "MANAGER" || m.role === "CO_OWNER")
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  const enrollments = await prisma.tournamentEnrollment.findMany({
    where: { id: { in: enrollmentIds }, status: "PENDING" },
  });

  for (const enrollment of enrollments) {
    await prisma.$transaction(async (tx) => {
      // 1. Update Enrollment
      await tx.tournamentEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "APPROVED" },
      });

      // 2. Create Tournament Player
      const existingPlayer = await tx.tournamentPlayer.findFirst({
        where: {
          tournamentId: tournament.id,
          email: enrollment.email,
        },
      });

      if (!existingPlayer) {
        await tx.tournamentPlayer.create({
          data: {
            tournamentId: tournament.id,
            name: enrollment.name,
            email: enrollment.email,
            userId: enrollment.userId,
          },
        });
      }
    });

    // Send Email (Best effort)
    try {
      const html = EmailTemplates.EnrollmentApproved(
        enrollment.name,
        tournament.name
      );
      await sendEmail({
        to: enrollment.email,
        subject: `Enrollment Approved: ${tournament.name}`,
        html,
      });
    } catch (err) {
      console.error(
        `Failed to send approval email to ${enrollment.email}`,
        err
      );
    }
  }

  revalidatePath(`/tournament/${slug}/enrollments`);
}

export async function bulkRejectEnrollmentsAction(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const slug = formData.get("slug") as string;
  const enrollmentIds = (formData.get("enrollmentIds") as string).split(",");
  const reason = formData.get("reason") as string;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: { members: true },
  });

  if (!tournament) throw new Error("Tournament not found");

  // Check permissions
  const isManager = tournament.members.some(
    (m) =>
      m.userId === user.id && (m.role === "MANAGER" || m.role === "CO_OWNER")
  );
  if (tournament.ownerId !== user.id && !isManager) {
    throw new Error("Permission denied");
  }

  const enrollments = await prisma.tournamentEnrollment.findMany({
    where: { id: { in: enrollmentIds }, status: "PENDING" },
  });

  for (const enrollment of enrollments) {
    await prisma.tournamentEnrollment.update({
      where: { id: enrollment.id },
      data: { status: "REJECTED", adminNotes: reason },
    });

    // Send Email
    try {
      const html = EmailTemplates.EnrollmentRejected(
        enrollment.name,
        tournament.name,
        reason
      );
      await sendEmail({
        to: enrollment.email,
        subject: `Enrollment Rejected: ${tournament.name}`,
        html,
      });
    } catch (err) {
      console.error(
        `Failed to send rejection email to ${enrollment.email}`,
        err
      );
    }
  }

  revalidatePath(`/tournament/${slug}/enrollments`);
}
