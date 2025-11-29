const BaseLayout = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Outfit', Arial, sans-serif; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #E2852E 0%, #F5C857 100%); padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; color: white; font-size: 24px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .button { display: inline-block; padding: 12px 24px; background-color: #E2852E; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .highlight { color: #E2852E; font-weight: 700; }
    .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 600; margin-top: 10px; }
    .status-approved { background-color: #dcfce7; color: #16a34a; }
    .status-rejected { background-color: #fee2e2; color: #dc2626; }
    .status-pending { background-color: #fef9c3; color: #ca8a04; }
  </style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <h1>CourtPulse</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} CourtPulse Tournament System. All rights reserved.</p>
        <p>This is an automated message, please do not reply directly.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const EmailTemplates = {
  AdminOtp: (otp: string) =>
    BaseLayout(
      `
    <h2 style="margin-top: 0; color: #1f2937;">Admin Access Verification</h2>
    <p>Hello Admin,</p>
    <p>A request was made to access the admin dashboard. Please use the following One-Time Password (OTP) to verify your identity:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #E2852E; background: #fff7ed; padding: 10px 20px; border-radius: 8px; border: 1px dashed #E2852E;">${otp}</span>
    </div>
    <p>This code will expire in 10 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
  `,
      "Admin Verification Code"
    ),

  EnrollmentReceived: (name: string, tournamentName: string) =>
    BaseLayout(
      `
    <h2 style="margin-top: 0; color: #1f2937;">Enrollment Received</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>We have received your enrollment request for <span class="highlight">${tournamentName}</span>.</p>
    <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #F5C857;">
      <p style="margin: 0;"><strong>Status:</strong> <span style="color: #ca8a04;">PENDING REVIEW</span></p>
    </div>
    <p>Your application is currently being reviewed by the tournament organizers. You will receive another email once your status is updated.</p>
  `,
      `Enrollment Received: ${tournamentName}`
    ),

  EnrollmentApproved: (name: string, tournamentName: string) =>
    BaseLayout(
      `
    <h2 style="margin-top: 0; color: #1f2937;">Enrollment Approved! 🎉</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Great news! Your enrollment for <span class="highlight">${tournamentName}</span> has been approved.</p>
    <div style="margin: 20px 0; padding: 15px; background-color: #f0fdf4; border-radius: 6px; border-left: 4px solid #22c55e;">
      <p style="margin: 0;"><strong>Status:</strong> <span style="color: #15803d;">APPROVED</span></p>
    </div>
    <p>You are now officially a player in the tournament. Get ready to play!</p>
  `,
      `Enrollment Approved: ${tournamentName}`
    ),

  EnrollmentRejected: (name: string, tournamentName: string, reason?: string) =>
    BaseLayout(
      `
    <h2 style="margin-top: 0; color: #1f2937;">Enrollment Update</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>We regret to inform you that your enrollment for <span class="highlight">${tournamentName}</span> has been declined.</p>
    <div style="margin: 20px 0; padding: 15px; background-color: #fef2f2; border-radius: 6px; border-left: 4px solid #ef4444;">
      <p style="margin: 0;"><strong>Status:</strong> <span style="color: #b91c1c;">REJECTED</span></p>
      ${
        reason
          ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #7f1d1d;"><strong>Reason:</strong> ${reason}</p>`
          : ""
      }
    </div>
    <p>If you have any questions, please contact the tournament organizer.</p>
  `,
      `Enrollment Update: ${tournamentName}`
    ),

  TeamInvitation: (
    inviteeName: string,
    teamName: string,
    inviterName: string,
    teamSlug: string
  ) =>
    BaseLayout(
      `
    <h2 style="margin-top: 0; color: #1f2937;">You've Been Invited to a Team! 🎯</h2>
    <p>Hi <strong>${inviteeName}</strong>,</p>
    <p><strong>${inviterName}</strong> has invited you to join their team: <span class="highlight">${teamName}</span>.</p>
    <div style="margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%); border-radius: 8px; border: 1px solid #F5C857;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #92400e;"><strong>Team:</strong> ${teamName}</p>
      <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Invited by:</strong> ${inviterName}</p>
    </div>
    <p>Click the button below to view the team and start playing:</p>
    <a href="${
      process.env.NEXT_PUBLIC_APP_URL || "https://courtpulse.vercel.app"
    }/team/${teamSlug}" class="button">View Team</a>
    <p style="margin-top: 30px; font-size: 14px; color: #64748b;">If you don't want to join this team, you can safely ignore this email.</p>
  `,
      `Team Invitation: ${teamName}`
    ),

  TournamentAnnouncement: (
    recipientName: string,
    tournamentName: string,
    announcement: string,
    tournamentSlug: string
  ) =>
    BaseLayout(
      `
    <h2 style="margin-top: 0; color: #1f2937;">📢 Tournament Announcement</h2>
    <p>Hi <strong>${recipientName}</strong>,</p>
    <p>An important announcement for <span class="highlight">${tournamentName}</span>:</p>
    <div style="margin: 25px 0; padding: 20px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
      <p style="margin: 0; color: #0c4a6e; line-height: 1.6;">${announcement}</p>
    </div>
    <a href="${
      process.env.NEXT_PUBLIC_APP_URL || "https://courtpulse.vercel.app"
    }/tournament/${tournamentSlug}" class="button">View Tournament</a>
  `,
      `Tournament Update: ${tournamentName}`
    ),

  MatchReminder: (
    playerName: string,
    tournamentName: string,
    opponentTeam: string,
    matchTime: string,
    matchId: string,
    tournamentSlug: string
  ) =>
    BaseLayout(
      `
    <h2 style="margin-top: 0; color: #1f2937;">⏰ Upcoming Match Reminder</h2>
    <p>Hi <strong>${playerName}</strong>,</p>
    <p>This is a friendly reminder that you have a match coming up in 24 hours!</p>
    <div style="margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 8px; border: 1px solid #ef4444;">
      <p style="margin: 0 0 10px 0; font-size: 16px; color: #991b1b;"><strong>🏆 ${tournamentName}</strong></p>
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #7f1d1d;"><strong>Opponent:</strong> ${opponentTeam}</p>
      <p style="margin: 0; font-size: 14px; color: #7f1d1d;"><strong>Scheduled Time:</strong> ${matchTime}</p>
    </div>
    <p>Make sure you're ready and warmed up. Good luck! 💪</p>
    <a href="${
      process.env.NEXT_PUBLIC_APP_URL || "https://courtpulse.vercel.app"
    }/tournament/${tournamentSlug}/match/${matchId}" class="button">View Match Details</a>
  `,
      `Match Reminder: ${tournamentName}`
    ),

  WeeklyDigest: (
    userName: string,
    weekStats: {
      gamesPlayed: number;
      wins: number;
      losses: number;
      pointsScored: number;
      achievements: string[];
    }
  ) =>
    BaseLayout(
      `
    <h2 style="margin-top: 0; color: #1f2937;">📊 Your Weekly Performance Summary</h2>
    <p>Hi <strong>${userName}</strong>,</p>
    <p>Here's how you performed this week on CourtPulse:</p>
    <div style="margin: 25px 0;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
        <div style="padding: 15px; background-color: #f0fdf4; border-radius: 6px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #15803d;">${
            weekStats.gamesPlayed
          }</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #166534; text-transform: uppercase;">Games Played</p>
        </div>
        <div style="padding: 15px; background-color: #ecfdf5; border-radius: 6px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">${
            weekStats.wins
          }</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #047857; text-transform: uppercase;">Wins</p>
        </div>
        <div style="padding: 15px; background-color: #fef2f2; border-radius: 6px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #dc2626;">${
            weekStats.losses
          }</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #b91c1c; text-transform: uppercase;">Losses</p>
        </div>
        <div style="padding: 15px; background-color: #fef9c3; border-radius: 6px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #ca8a04;">${
            weekStats.pointsScored
          }</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #a16207; text-transform: uppercase;">Points Scored</p>
        </div>
      </div>
      ${
        weekStats.achievements.length > 0
          ? `
      <div style="padding: 15px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #E2852E;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #1f2937;">🏆 Achievements Unlocked:</p>
        <ul style="margin: 0; padding-left: 20px;">
          ${weekStats.achievements
            .map(
              (achievement) => `<li style="color: #475569;">${achievement}</li>`
            )
            .join("")}
        </ul>
      </div>
      `
          : ""
      }
    </div>
    <p>Keep up the great work! See you on the court next week. 🎾</p>
    <a href="${
      process.env.NEXT_PUBLIC_APP_URL || "https://courtpulse.vercel.app"
    }/settings" class="button">View Full Stats</a>
  `,
      "Your Weekly CourtPulse Digest"
    ),

  AchievementUnlocked: (
    userName: string,
    achievementName: string,
    achievementDescription: string,
    achievementIcon: string
  ) =>
    BaseLayout(
      `
    <div style="text-align: center;">
      <div style="font-size: 64px; margin: 20px 0;">${achievementIcon}</div>
      <h2 style="margin: 10px 0; color: #1f2937;">Achievement Unlocked!</h2>
      <p style="font-size: 20px; font-weight: 700; color: #E2852E; margin: 10px 0;">${achievementName}</p>
    </div>
    <p>Congratulations, <strong>${userName}</strong>!</p>
    <p>${achievementDescription}</p>
    <div style="margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%); border-radius: 8px; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">This achievement has been added to your profile. Keep pushing your limits!</p>
    </div>
    <a href="${
      process.env.NEXT_PUBLIC_APP_URL || "https://courtpulse.vercel.app"
    }/settings" class="button">View All Achievements</a>
  `,
      `New Achievement: ${achievementName}`
    ),

  MatchSummary: (
    playerName: string,
    tournamentName: string,
    teamName: string,
    opponentTeam: string,
    finalScore: string,
    result: "win" | "loss" | "draw",
    playerStats: { points: number; plays: number },
    matchId: string,
    tournamentSlug: string
  ) =>
    BaseLayout(
      `
    <h2 style="margin-top: 0; color: #1f2937;">🏁 Match Summary</h2>
    <p>Hi <strong>${playerName}</strong>,</p>
    <p>Your match in <span class="highlight">${tournamentName}</span> has concluded!</p>
    <div style="margin: 25px 0; padding: 20px; background-color: ${
      result === "win" ? "#f0fdf4" : result === "loss" ? "#fef2f2" : "#fef9c3"
    }; border-radius: 8px; border-left: 4px solid ${
        result === "win" ? "#22c55e" : result === "loss" ? "#ef4444" : "#eab308"
      };">
      <p style="margin: 0 0 15px 0; font-size: 18px; font-weight: 700; color: ${
        result === "win" ? "#15803d" : result === "loss" ? "#b91c1c" : "#a16207"
      }; text-transform: uppercase;">
        ${
          result === "win"
            ? "🎉 VICTORY!"
            : result === "loss"
            ? "💪 TOUGH LOSS"
            : "🤝 DRAW"
        }
      </p>
      <p style="margin: 0 0 10px 0; font-size: 16px; color: #1f2937;"><strong>${teamName}</strong> vs <strong>${opponentTeam}</strong></p>
      <p style="margin: 0; font-size: 20px; font-weight: 700; font-family: monospace; color: #1f2937;">${finalScore}</p>
    </div>
    <div style="margin: 25px 0; padding: 15px; background-color: #f8fafc; border-radius: 6px;">
      <p style="margin: 0 0 10px 0; font-weight: 600; color: #1f2937;">📈 Your Performance:</p>
      <p style="margin: 5px 0; color: #475569;"><strong>Points Scored:</strong> ${
        playerStats.points
      }</p>
      <p style="margin: 5px 0; color: #475569;"><strong>Games Played:</strong> ${
        playerStats.plays
      }</p>
    </div>
    <p>${
      result === "win"
        ? "Excellent performance! Keep up the winning streak! 🔥"
        : result === "loss"
        ? "Don't worry, champions are built in practice. Come back stronger! 💪"
        : "A hard-fought draw! Great effort out there! 🤝"
    }</p>
    <a href="${
      process.env.NEXT_PUBLIC_APP_URL || "https://courtpulse.vercel.app"
    }/tournament/${tournamentSlug}/match/${matchId}" class="button">View Full Match Details</a>
  `,
      `Match Summary: ${teamName} vs ${opponentTeam}`
    ),

  SessionReminder: (
    playerName: string,
    teamName: string,
    sessionDate: string,
    sessionId: string,
    teamSlug: string
  ) =>
    BaseLayout(
      `
    <h2 style="margin-top: 0; color: #1f2937;">🎾 Session Reminder</h2>
    <p>Hi <strong>${playerName}</strong>,</p>
    <p>Don't forget about your upcoming session with <span class="highlight">${teamName}</span>!</p>
    <div style="margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; border: 1px solid #0ea5e9;">
      <p style="margin: 0 0 10px 0; font-size: 16px; color: #0c4a6e;"><strong>Team:</strong> ${teamName}</p>
      <p style="margin: 0; font-size: 16px; color: #0c4a6e;"><strong>Date:</strong> ${sessionDate}</p>
    </div>
    <p>Make sure you're ready to play. See you on the court! 🏆</p>
    <a href="${
      process.env.NEXT_PUBLIC_APP_URL || "https://courtpulse.vercel.app"
    }/team/${teamSlug}/session/${sessionId}" class="button">View Session Details</a>
  `,
      `Session Reminder: ${teamName}`
    ),
};
