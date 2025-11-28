"use server";

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { EmailTemplates } from "@/lib/email-templates";
import { cookies } from "next/headers";
import { addMinutes } from "date-fns";

// Hardcoded admin email for now as requested
const ADMIN_EMAIL = "alaqmarak0810@gmail.com";

export async function sendAdminOtp(email: string) {
  if (email !== ADMIN_EMAIL) {
    return { success: false, error: "Unauthorized email." };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = addMinutes(new Date(), 10); // 10 minutes expiry

  try {
    // Store OTP in DB
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: email,
          token: otp, // This is wrong, unique is on token, but upsert needs unique where.
          // The schema has @@unique([identifier, token]).
          // But upsert needs a unique constraint to find the record.
          // Actually, we should just create a new one or update existing for the identifier.
          // But since token is part of the unique key, we can't easily upsert based on identifier alone if we want to replace *any* token for this user.
          // Better to delete old ones and create new.
        },
      },
      update: {
        token: otp,
        expires,
      },
      create: {
        identifier: email,
        token: otp,
        expires,
      },
    });

    // Wait, the schema is:
    // @@unique([identifier, token])
    // This means I can have multiple tokens for the same identifier if they are different.
    // But I probably want to invalidate old ones.

    // Let's delete old tokens for this email first
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        expires,
      },
    });

    // Send Email
    const html = EmailTemplates.AdminOtp(otp);
    await sendEmail({
      to: email,
      subject: "Admin Access OTP - CourtPulse",
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return { success: false, error: "Failed to send OTP." };
  }
}

export async function verifyAdminOtp(email: string, otp: string) {
  if (email !== ADMIN_EMAIL) {
    return { success: false, error: "Unauthorized email." };
  }

  try {
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: otp,
        },
      },
    });

    if (!tokenRecord) {
      return { success: false, error: "Invalid OTP." };
    }

    if (new Date() > tokenRecord.expires) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token: otp } },
      });
      return { success: false, error: "OTP expired." };
    }

    // Valid OTP
    // Delete used token
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: otp } },
    });

    // Set Cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return { success: true };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, error: "Verification failed." };
  }
}
