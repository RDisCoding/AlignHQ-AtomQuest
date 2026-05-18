import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma, UomType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sharedGoals = await prisma.$queryRaw<Array<{
      id: string;
      title: string;
      description: string | null;
      thrustArea: string;
      uomType: string;
      target: number;
      primaryOwnerId: string | null;
      primaryOwnerName: string | null;
      primaryOwnerEmail: string | null;
      createdAt: Date;
      updatedAt: Date;
      assignedCount: number;
      childCount: number;
    }>>`
      SELECT
        sg.id,
        sg.title,
        sg.description,
        sg."thrustArea",
        sg."uomType",
        sg.target,
        sg."primaryOwnerId",
        u.name AS "primaryOwnerName",
        u.email AS "primaryOwnerEmail",
        sg."createdAt",
        sg."updatedAt",
        COALESCE(assignments.assigned_count, 0)::int AS "assignedCount",
        COALESCE(children.child_count, 0)::int AS "childCount"
      FROM "SharedGoal" sg
      LEFT JOIN "EmployeeProfile" ep ON ep.id = sg."primaryOwnerId"
      LEFT JOIN "User" u ON u.id = ep."userId"
      LEFT JOIN (
        SELECT "B" AS shared_goal_id, COUNT(*) AS assigned_count
        FROM "_EmployeeProfileToSharedGoal"
        GROUP BY "B"
      ) assignments ON assignments.shared_goal_id = sg.id
      LEFT JOIN (
        SELECT "sharedGoalId", COUNT(*) AS child_count
        FROM "Goal"
        WHERE "sharedGoalId" IS NOT NULL
        GROUP BY "sharedGoalId"
      ) children ON children."sharedGoalId" = sg.id
      ORDER BY sg."createdAt" DESC
    `;

    return NextResponse.json(sharedGoals, { status: 200 });
  } catch (error) {
    console.error("Error fetching shared goals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id || session.user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, thrustArea, uomType, target, primaryOwnerId, assignedEmployeeIds = [], period = "2024-Q1" } = body;

    if (!title || !thrustArea || !target || !primaryOwnerId) {
      return NextResponse.json({ error: "Missing required fields including primary owner" }, { status: 400 });
    }

    const accessibleEmployees = session.user.role === "MANAGER"
      ? await prisma.employeeProfile.findMany({
          where: {
            manager: { userId: session.user.id },
          },
          include: { user: { select: { name: true, email: true } } },
        })
      : await prisma.employeeProfile.findMany({
          where: { user: { role: "EMPLOYEE" } },
          include: { user: { select: { name: true, email: true } } },
        });

    const accessibleEmployeeIds = new Set(accessibleEmployees.map((employee) => employee.id));
    const selectedEmployeeIds = Array.isArray(assignedEmployeeIds) && assignedEmployeeIds.length > 0
      ? assignedEmployeeIds.filter((employeeId: string) => accessibleEmployeeIds.has(employeeId))
      : accessibleEmployees.map((employee) => employee.id);

    if (selectedEmployeeIds.length === 0) {
      return NextResponse.json({ error: "Select at least one employee to receive the shared goal" }, { status: 400 });
    }

    if (!selectedEmployeeIds.includes(primaryOwnerId)) {
      return NextResponse.json({ error: "Primary owner must be one of the selected employees" }, { status: 400 });
    }

    const sharedGoal = await prisma.$transaction(async (tx) => {
      const [createdSharedGoal] = await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          INSERT INTO "SharedGoal" (title, description, "thrustArea", "uomType", target, "primaryOwnerId")
          VALUES (${title}, ${description ?? null}, ${thrustArea}, ${uomType as UomType}, ${parseFloat(target)}, ${primaryOwnerId})
          RETURNING id
        `
      );

      for (const employeeId of selectedEmployeeIds) {
        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO "_EmployeeProfileToSharedGoal" ("A", "B")
            SELECT ${employeeId}, ${createdSharedGoal.id}
            WHERE NOT EXISTS (
              SELECT 1 FROM "_EmployeeProfileToSharedGoal"
              WHERE "A" = ${employeeId} AND "B" = ${createdSharedGoal.id}
            )
          `
        );
      }

      for (const employeeId of selectedEmployeeIds) {
        let goalSheet = await tx.goalSheet.findFirst({
          where: {
            employeeId,
            period,
          },
        });

        if (!goalSheet) {
          goalSheet = await tx.goalSheet.create({
            data: {
              employeeId,
              period,
              status: "DRAFT",
            },
          });
        }

        const existingGoal = await tx.goal.findFirst({
          where: {
            goalSheetId: goalSheet.id,
            sharedGoalId: createdSharedGoal.id,
          },
        });

        if (existingGoal) {
          await tx.goal.update({
            where: { id: existingGoal.id },
            data: {
              title,
              description,
              thrustArea,
              uomType: uomType as UomType,
              target: parseFloat(target),
            },
          });
          continue;
        }

        await tx.goal.create({
          data: {
            goalSheetId: goalSheet.id,
            sharedGoalId: createdSharedGoal.id,
            title,
            description,
            thrustArea,
            uomType: uomType as UomType,
            target: parseFloat(target),
            weightage: 0,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "SHARED_GOAL_CREATED",
          newValue: `${title} -> ${selectedEmployeeIds.length} employees`,
        },
      });

      return {
        id: createdSharedGoal.id,
        title,
        description,
        thrustArea,
        uomType,
        target: parseFloat(target),
      };
    });

    return NextResponse.json(sharedGoal, { status: 201 });
  } catch (error) {
    console.error("Error creating shared goal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
