"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";

export type PlayerPrivacySettings = {
  showProfile: boolean;
  showStats: boolean;
  showAchievements: boolean;
  showMatchHistory: boolean;
  showBio: boolean;
};

const DEFAULT_PRIVACY: PlayerPrivacySettings = {
  showProfile: true,
  showStats: true,
  showAchievements: true,
  showMatchHistory: false,
  showBio: true,
};

/**
 * Get player privacy settings
 */
export async function getPlayerPrivacy(
  userId: string
): Promise<PlayerPrivacySettings> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bio: true },
  });

  // For now, store in bio as JSON until we add privacy columns
  // TODO: Add privacy columns to User model
  if (user?.bio && user.bio.startsWith("{")) {
    try {
      const bio = JSON.parse(user.bio);
      if (bio.privacy) {
        return { ...DEFAULT_PRIVACY, ...bio.privacy };
      }
    } catch (e) {
      // Invalid JSON, use defaults
    }
  }

  return DEFAULT_PRIVACY;
}

/**
 * Update player privacy settings
 */
export async function updatePlayerPrivacy(
  settings: Partial<PlayerPrivacySettings>
): Promise<void> {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  // Get current bio
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { bio: true },
  });

  let bioData: any = {};
  if (currentUser?.bio && currentUser.bio.startsWith("{")) {
    try {
      bioData = JSON.parse(currentUser.bio);
    } catch (e) {
      bioData = { text: currentUser.bio };
    }
  } else {
    bioData = { text: currentUser?.bio || "" };
  }

  // Update privacy settings
  bioData.privacy = { ...DEFAULT_PRIVACY, ...bioData.privacy, ...settings };

  await prisma.user.update({
    where: { id: user.id },
    data: { bio: JSON.stringify(bioData) },
  });
}

/**
 * Check if a specific privacy setting is enabled
 */
export async function checkPrivacy(
  userId: string,
  setting: keyof PlayerPrivacySettings
): Promise<boolean> {
  const privacy = await getPlayerPrivacy(userId);
  return privacy[setting];
}

/**
 * Check if a profile is visible to a viewer
 */
export async function checkProfileVisibility(
  targetUserId: string,
  viewerId?: string
): Promise<{ allowed: boolean }> {
  // Owner can always view
  if (viewerId && viewerId === targetUserId) {
    return { allowed: true };
  }

  // Check privacy setting
  const isPublic = await checkPrivacy(targetUserId, "showProfile");
  return { allowed: isPublic };
}
