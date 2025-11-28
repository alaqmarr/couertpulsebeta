import { User } from "@/app/prisma";
import { FeatureCapability, PLAN_CONFIG } from "@/config/subscription-plans";

/**
 * Checks if a user has a specific capability based on their package type.
 */
export function hasCapability(
  user: User,
  capability: FeatureCapability
): boolean {
  const plan = PLAN_CONFIG[user.packageType];
  return plan?.capabilities.includes(capability) ?? false;
}

/**
 * Checks if a user has a specific capability and throws an error if not.
 * Useful for server actions.
 */
export function checkCapability(user: User, capability: FeatureCapability) {
  if (!hasCapability(user, capability)) {
    throw new Error(`Upgrade your plan to access: ${capability}`);
  }
}

/**
 * Checks if a user has reached their limit for a specific resource.
 */
export function checkLimit(
  user: User,
  resource: "maxTeams" | "maxTournaments"
) {
  const plan = PLAN_CONFIG[user.packageType];
  const limit = plan?.limits[resource] ?? 0;

  const currentCount =
    resource === "maxTeams" ? user.teamCount : user.tournamentCount;

  if (currentCount >= limit) {
    throw new Error(
      `You have reached the limit for ${resource} (${limit}). Upgrade to create more.`
    );
  }
}
