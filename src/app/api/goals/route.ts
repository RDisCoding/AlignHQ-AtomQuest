import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UomType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { goals, period } = body;

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json({ error: "At least one goal is required." }, { status: 400 });
    }

    if (goals.length > 8) {
      return NextResponse.json({ error: "Maximum 8 goals allowed." }, { status: 400 });
    }

    const sharedGoalIds = Array.from(
      new Set(
        goals
          .map((goal: any) => goal.sharedGoalId)
          .filter((sharedGoalId: string | null | undefined): sharedGoalId is string => Boolean(sharedGoalId))
      )
    );

    const sharedGoals = sharedGoalIds.length > 0
      ? await prisma.sharedGoal.findMany({
          where: { id: { in: sharedGoalIds } },
          select: {
            id: true,
            title: true,
            description: true,
            thrustArea: true,
            uomType: true,
            target: true,
          },
        })
      : [];

    const sharedGoalMap = new Map(sharedGoals.map((sharedGoal) => [sharedGoal.id, sharedGoal]));

    const normalizedGoals = goals.map((goal: any) => {
      const sharedGoal = goal.sharedGoalId ? sharedGoalMap.get(goal.sharedGoalId) : null;

      if (goal.sharedGoalId && !sharedGoal) {
        throw new Error(`Shared goal ${goal.sharedGoalId} not found.`);
      }

      return {
        title: sharedGoal?.title ?? goal.title,
        description: sharedGoal?.description ?? goal.description,
        thrustArea: sharedGoal?.thrustArea ?? goal.thrustArea,
        uomType: (sharedGoal?.uomType ?? goal.uomType) as UomType,
        target: sharedGoal?.target ?? parseFloat(goal.target),
        weightage: parseFloat(goal.weightage),
        sharedGoalId: goal.sharedGoalId ?? null,
      };
    });

    let totalWeightage = 0;

    for (const goal of normalizedGoals) {
      const weight = goal.weightage;
      if (isNaN(weight) || weight < 10) {
        return NextResponse.json({ error: `Goal "${goal.title}" must have at least 10% weightage.` }, { status: 400 });
      }
      totalWeightage += weight;
    }

    if (Math.abs(totalWeightage - 100) > 0.01) {
      return NextResponse.json({ error: "Total weightage must be exactly 100%." }, { status: 400 });
    }

    const employeeProfile = await prisma.employeeProfile.upsert({
      where: { userId: session.user.id },
      update: {},
      create: {
        userId: session.user.id,
      }
    });

    // Check if there's an existing DRAFT sheet with shared goals for this period
    const existingSheet = await prisma.goalSheet.findFirst({
      where: { employeeId: employeeProfile.id, period: period || "2024-Q1", status: "DRAFT" },
      include: { goals: true }
    });

    if (existingSheet) {
      // Update existing sheet — update shared goal weightages, replace personal goals
      await prisma.$transaction(async (tx) => {
        // Delete only non-shared goals from the existing sheet
        await tx.goal.deleteMany({
          where: { goalSheetId: existingSheet.id, sharedGoalId: null }
        });

        // Update shared goals' weightage
        for (const goal of normalizedGoals) {
          if (goal.sharedGoalId) {
            const existingSharedGoal = existingSheet.goals.find((sheetGoal) => sheetGoal.sharedGoalId === goal.sharedGoalId);
            if (!existingSharedGoal) continue;

            await tx.goal.update({
              where: { id: existingSharedGoal.id },
              data: {
                weightage: goal.weightage,
                title: goal.title,
                description: goal.description,
                thrustArea: goal.thrustArea,
                uomType: goal.uomType,
                target: goal.target,
              }
            });
          }
        }

        // Create new personal goals
        const personalGoals = normalizedGoals.filter((g: any) => !g.sharedGoalId);
        for (const g of personalGoals) {
          await tx.goal.create({
            data: {
              goalSheetId: existingSheet.id,
              title: g.title,
              description: g.description,
              thrustArea: g.thrustArea,
              uomType: g.uomType as UomType,
              target: g.target,
              weightage: g.weightage,
              sharedGoalId: g.sharedGoalId,
            }
          });
        }

        // Update the sheet status to SUBMITTED
        await tx.goalSheet.update({
          where: { id: existingSheet.id },
          data: { status: "SUBMITTED" }
        });
      });

      const updated = await prisma.goalSheet.findUnique({
        where: { id: existingSheet.id },
        include: { goals: true }
      });

      return NextResponse.json(updated, { status: 201 });
    }

    // Create new Goal Sheet with all goals
    const goalSheet = await prisma.goalSheet.create({
      data: {
        employeeId: employeeProfile.id,
        period: period || "2024-Q1",
        status: "SUBMITTED",
        goals: {
          create: normalizedGoals.map((g: any) => ({
            title: g.title,
            description: g.description,
            thrustArea: g.thrustArea,
            uomType: g.uomType as UomType,
            target: g.target,
            weightage: g.weightage,
            sharedGoalId: g.sharedGoalId,
          }))
        }
      },
      include: {
        goals: true
      }
    });

    return NextResponse.json(goalSheet, { status: 201 });
  } catch (error) {
    console.error("Error creating goal sheet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employeeProfile = await prisma.employeeProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!employeeProfile) {
      return NextResponse.json([], { status: 200 });
    }

    const goalSheets = await prisma.goalSheet.findMany({
      where: { employeeId: employeeProfile.id },
      include: { 
        goals: {
          include: { sharedGoal: { select: { id: true, title: true } } }
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(goalSheets, { status: 200 });
  } catch (error) {
    console.error("Error fetching goal sheets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
