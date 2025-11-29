import { analyticsDb } from "@/lib/analytics-db";

/**
 * Queue email for sending (ANALYTICS DB)
 * Email logs are write-heavy and used for analytics/auditing
 */
import { sendEmail } from "@/lib/email";

export async function queueEmail(
  recipient: string,
  subject: string,
  body: string,
  userId?: string
) {
  // Try sending immediately first
  const result = await sendEmail({ to: recipient, subject, text: body });

  // Log to Analytics DB
  await analyticsDb.emailLog.create({
    data: {
      recipient,
      subject,
      body,
      status: result.success ? "SENT" : "PENDING",
      error: result.success ? null : result.error,
      sentAt: result.success ? new Date() : null,
      userId: userId || null,
    },
  });
}

/**
 * Get pending emails from Analytics DB
 */
export async function getPendingEmails(limit: number = 50) {
  return await analyticsDb.emailLog.findMany({
    where: { status: "PENDING" },
    take: limit,
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Mark email as sent in Analytics DB
 */
export async function markEmailSent(emailId: string) {
  await analyticsDb.emailLog.update({
    where: { id: emailId },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });
}

/**
 * Mark email as failed in Analytics DB
 */
export async function markEmailFailed(emailId: string, error: string) {
  await analyticsDb.emailLog.update({
    where: { id: emailId },
    data: {
      status: "FAILED",
      error,
    },
  });
}
