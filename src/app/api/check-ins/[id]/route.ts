import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma, ProgressStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id },
      include: {
        goals: {
          include: { 
            checkIns: true,
            sharedGoal: true
          }
        }
      }
    });

    if (!goalSheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(goalSheet, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employeeProfile = await prisma.employeeProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const body = await req.json();
    const { quarter, entries } = body;

    // First, verify permissions for all goals
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id },
      include: { 
        goals: { 
          include: { 
            sharedGoal: true 
          } 
        } 
      }
    });

    if (!goalSheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const sharedGoalIds = Array.from(
      new Set(goalSheet.goals.map((goal) => goal.sharedGoalId).filter((sharedGoalId): sharedGoalId is string => Boolean(sharedGoalId)))
    );

    const sharedGoalOwners = sharedGoalIds.length > 0
      ? await prisma.$queryRaw<Array<{ id: string; primaryOwnerId: string | null }>>(
          Prisma.sql`SELECT id, "primaryOwnerId" FROM "SharedGoal" WHERE id IN (${Prisma.join(sharedGoalIds)})`
        )
      : [];

    const sharedGoalOwnerMap = new Map(sharedGoalOwners.map((sharedGoal) => [sharedGoal.id, sharedGoal.primaryOwnerId]));

    const goalsMap = new Map(goalSheet.goals.map(g => [g.id, g]));

    // entries: { [goalId]: { actual: string, status: string } }
    // Filter entries to only allow edits for non-shared goals OR shared goals where user is primary owner
    const validEntries = Object.entries(entries).filter(([goalId]) => {
      const goal = goalsMap.get(goalId);
      if (!goal) return false;
      if (!goal.sharedGoalId) return true; // Normal goal
      // Shared goal: only primary owner can edit
      return sharedGoalOwnerMap.get(goal.sharedGoalId) === employeeProfile?.id;
    });

    // Since we don't have a compound unique index, use a manual upsert
    const results = await Promise.all(
      validEntries.map(async ([goalId, entry]: [string, any]) => {
        const actualAchievement = entry.actual !== "" ? parseFloat(entry.actual) : null;
        const status = entry.status as ProgressStatus;

        const existing = await prisma.checkIn.findFirst({
          where: { goalId, quarter }
        });

        if (existing) {
          return prisma.checkIn.update({
            where: { id: existing.id },
            data: { actualAchievement, status }
          });
        } else {
          return prisma.checkIn.create({
            data: { goalId, quarter, actualAchievement, status }
          });
        }
      })
    );

    // If this is a Shared Goal, sync achievement to sibling goals
    for (const sharedGoal of goalSheet.goals) {
      if (!sharedGoal.sharedGoalId) continue;
      // Only sync if the current user is the primary owner
      if (sharedGoalOwnerMap.get(sharedGoal.sharedGoalId) !== employeeProfile?.id) continue;
      
      const entry = entries[sharedGoal.id];
      if (!entry) continue;

      const actualAchievement = entry.actual !== "" ? parseFloat(entry.actual) : null;
      if (actualAchievement == null) continue;

      // Find all sibling goals that reference the same SharedGoal
      const siblingGoals = await prisma.goal.findMany({
        where: { sharedGoalId: sharedGoal.sharedGoalId, id: { not: sharedGoal.id } }
      });

      for (const sibling of siblingGoals) {
        const siblingCheckIn = await prisma.checkIn.findFirst({
          where: { goalId: sibling.id, quarter }
        });

        if (siblingCheckIn) {
          await prisma.checkIn.update({
            where: { id: siblingCheckIn.id },
            data: { actualAchievement, status: entry.status as ProgressStatus }
          });
        } else {
          await prisma.checkIn.create({
            data: { goalId: sibling.id, quarter, actualAchievement, status: entry.status as ProgressStatus }
          });
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
