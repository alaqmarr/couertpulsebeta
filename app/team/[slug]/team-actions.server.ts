"use server";

import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";

/* =========================================================
   ADD TEAM MEMBER
   ========================================================= */

export async function addMemberAction(slug: string, email: string, name: string) {
  const currentUser = await getOrCreateUser();
  if (!currentUser) throw new Error("Unauthorized");

  const team = await prisma.team.findUnique({ where: { slug } });
  if (!team) throw new Error("Team not found");

  if (team.ownerId !== currentUser.id)
    throw new Error("Only team owner can add members.");

  const existingMember = await prisma.teamMember.findFirst({
    where: { teamId: team.id, email },
  });
  if (existingMember) throw new Error("Member already exists.");

  const normalizedEmail = email.toLowerCase();
  let linkedUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!linkedUser) {
    linkedUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0],
        packageType: "FREE",
        wins: 0,
        losses: 0,
      },
    });
  }

  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: linkedUser.id,
      email: normalizedEmail,
      displayName: linkedUser.name ?? normalizedEmail.split("@")[0],
      role: "MEMBER",
    },
  });

  revalidatePath(`/team/${slug}`);
}

/* =========================================================
   REMOVE TEAM MEMBER
   ========================================================= */

export async function removeMemberAction(slug: string, memberId: string) {
  const currentUser = await getOrCreateUser();
  if (!currentUser) throw new Error("Unauthorized");

  const team = await prisma.team.findUnique({ where: { slug } });
  if (!team) throw new Error("Team not found");
  if (team.ownerId !== currentUser.id)
    throw new Error("Only team owner can remove members.");

  await prisma.teamMember.delete({ where: { id: memberId } });
  revalidatePath(`/team/${slug}`);
}

/* =========================================================
   DELETE TEAM (OWNER ONLY)
   ========================================================= */

export async function deleteTeamAction(slug: string) {
  const currentUser = await getOrCreateUser();
  if (!currentUser) throw new Error("Unauthorized");

  const team = await prisma.team.findUnique({ where: { slug } });
  if (!team) throw new Error("Team not found");
  if (team.ownerId !== currentUser.id)
    throw new Error("Only team owner can delete this team.");

  await prisma.team.delete({ where: { id: team.id } });

  // Update quota usage
  await prisma.user.update({
    where: { id: currentUser.id },
    data: { teamCount: { decrement: 1 } },
  });

  revalidatePath("/dashboard");
}

/* ---------------- CREATE SESSION ---------------- */
export async function createSessionAction(teamSlug: string, name: string) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
  if (!team) throw new Error("Team not found");
  if (team.ownerId !== user.id)
    throw new Error("Only the team owner can create sessions.");

  const slug = `${teamSlug}-session-${Date.now()}`;

  const session = await prisma.session.create({
    data: {
      teamId: team.id,
      name,
      slug,
      date: new Date(),
    },
  });

  revalidatePath(`/team/${teamSlug}`);
  return { slug: session.slug }; // ✅ return slug for client redirect
}

/* ---------------- DELETE SESSION ---------------- */
export async function deleteSessionAction(teamSlug: string, sessionId: string) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Unauthorized");

  const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
  if (!team) throw new Error("Team not found");
  if (team.ownerId !== user.id)
    throw new Error("Only the team owner can delete sessions.");

  await prisma.session.delete({ where: { id: sessionId } });
  revalidatePath(`/team/${teamSlug}`);
}