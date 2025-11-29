import { TournamentTeam } from "@/app/prisma";
import { sendEmail } from "@/lib/email";
import {
  getPendingEmails,
  markEmailSent,
  markEmailFailed,
} from "@/lib/email-queue";

interface Match {
  homeTeamId: string;
  awayTeamId: string;
  round: number;
}

export function generateRoundRobinSchedule(teams: TournamentTeam[]): Match[] {
  if (teams.length < 2) return [];

  const schedule: Match[] = [];
  const teamIds = teams.map((t) => t.id);

  // If odd number of teams, add a dummy team for "bye"
  if (teamIds.length % 2 !== 0) {
    teamIds.push("BYE");
  }

  const numRounds = teamIds.length - 1;
  const halfSize = teamIds.length / 2;

  const teamList = [...teamIds];

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const home = teamList[i];
      const away = teamList[teamList.length - 1 - i];

      if (home !== "BYE" && away !== "BYE") {
        schedule.push({
          homeTeamId: home,
          awayTeamId: away,
          round: round + 1,
        });
      }
    }

    // Rotate teams for next round (keep first team fixed)
    const first = teamList[0];
    const remaining = teamList.slice(1);
    remaining.unshift(remaining.pop()!);
    teamList.splice(0, teamList.length, first, ...remaining);
  }

  return schedule;
}

export async function processEmailQueue() {
  const pendingEmails = await getPendingEmails(20); // Process 20 at a time

  if (pendingEmails.length === 0) {
    return { processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;

  for (const email of pendingEmails) {
    const result = await sendEmail({
      to: email.recipient,
      subject: email.subject,
      text: email.body,
    });

    if (result.success) {
      await markEmailSent(email.id);
      processed++;
    } else {
      console.error(`Failed to send email ${email.id}:`, result.error);
      await markEmailFailed(email.id, result.error || "Unknown error");
      errors++;
    }
  }

  return { processed, errors };
}
