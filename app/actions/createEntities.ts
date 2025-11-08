"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

/**
 * Create a new team if user's plan allows it.
 */
export async function createTeamAction(name: string) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  // Plan enforcement
  const limit = user.teamQuota ?? 1;
  const currentCount = await prisma.team.count({ where: { ownerId: user.id } });
  if (currentCount >= limit)
    throw new Error(
      `Team creation limit reached for your plan (${user.packageType}).`
    );

  const slug = slugify(name, { lower: true, strict: true });

  const existing = await prisma.team.findUnique({ where: { slug } });
  if (existing) throw new Error("A team with this name already exists.");

  const team = await prisma.team.create({
    data: {
      name,
      slug,
      ownerId: user.id,
      members: {
        create: [
          {
            email: user.email,
            displayName: user.name ?? user.email.split("@")[0],
            role: "OWNER",
            userId: user.id,
          },
        ],
      },
    },
  });

  // Update user team count
  await prisma.user.update({
    where: { id: user.id },
    data: { teamCount: { increment: 1 } },
  });

  revalidatePath("/dashboard");
  return team;
}

/**
 * Create a new tournament if user's plan allows it.
 */
export async function createTournamentAction(name: string) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  // Plan enforcement
  const limit = user.tournamentQuota ?? 1;
  const currentCount = await prisma.tournament.count({
    where: { ownerId: user.id },
  });
  if (currentCount >= limit)
    throw new Error(
      `Tournament creation limit reached for your plan (${user.packageType}).`
    );

  const slug = slugify(name, { lower: true, strict: true });

  const existing = await prisma.tournament.findUnique({ where: { slug } });
  if (existing) throw new Error("A tournament with this name already exists.");

  const tournament = await prisma.tournament.create({
    data: {
      name,
      slug,
      ownerId: user.id,
    },
  });

  // Update user tournament count
  await prisma.user.update({
    where: { id: user.id },
    data: { tournamentCount: { increment: 1 } },
  });

  revalidatePath("/dashboard");
  return tournament;
}
