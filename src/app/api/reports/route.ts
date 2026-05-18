import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // For managers/admins, get all; for employees, get their own
    let whereClause = {};
    if (session.user.role === "EMPLOYEE") {
      const profile = await prisma.employeeProfile.findUnique({ where: { userId: session.user.id } });
      if (!profile) return NextResponse.json([], { status: 200 });
      whereClause = { employee: { id: profile.id } };
    }

    const goalSheets = await prisma.goalSheet.findMany({
      where: { ...whereClause, status: { in: ["LOCKED", "APPROVED"] } },
      include: {
        employee: { include: { user: { select: { name: true, email: true } } } },
        goals: {
          include: { checkIns: true }
        }
      }
    });

    // Flatten into report rows
    const rows = goalSheets.flatMap(sheet =>
      sheet.goals.map(goal => {
        const getCheckIn = (quarter: string) => goal.checkIns.find(ci => ci.quarter === quarter);
        const q1 = getCheckIn("Q1");
        const q2 = getCheckIn("Q2");
        const q3 = getCheckIn("Q3");
        const q4 = getCheckIn("Q4");

        return {
          employeeName: sheet.employee.user.name,
          employeeEmail: sheet.employee.user.email,
          period: sheet.period,
          goalTitle: goal.title,
          thrustArea: goal.thrustArea,
          uomType: goal.uomType,
          target: goal.target,
          weightage: goal.weightage,
          q1Actual: q1?.actualAchievement ?? null,
          q1Status: q1?.status ?? null,
          q2Actual: q2?.actualAchievement ?? null,
          q2Status: q2?.status ?? null,
          q3Actual: q3?.actualAchievement ?? null,
          q3Status: q3?.status ?? null,
          q4Actual: q4?.actualAchievement ?? null,
          q4Status: q4?.status ?? null,
        };
      })
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
