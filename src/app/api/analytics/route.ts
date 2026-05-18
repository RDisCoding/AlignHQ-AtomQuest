import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get all locked sheets with goals + check-ins
    let sheetsWhere = {};
    if (session.user.role === "EMPLOYEE") {
      const profile = await prisma.employeeProfile.findUnique({ where: { userId: session.user.id } });
      if (!profile) return NextResponse.json({ quarterlyTrend: [], statusBreakdown: [], thrustAreaData: [] });
      sheetsWhere = { employee: { id: profile.id } };
    }

    const goalSheets = await prisma.goalSheet.findMany({
      where: { ...sheetsWhere, status: { in: ["LOCKED"] } },
      include: {
        employee: { include: { user: { select: { name: true } } } },
        goals: {
          include: { checkIns: true }
        }
      }
    });

    const allGoals = goalSheets.flatMap(s => s.goals);

    // 1. Quarterly achievement trend data
    const quarters = ["Q1", "Q2", "Q3", "Q4"];
    const quarterlyTrend = quarters.map(quarter => {
      const checkIns = allGoals.flatMap(g => g.checkIns.filter(ci => ci.quarter === quarter && ci.actualAchievement != null));
      const completed = checkIns.filter(ci => ci.status === "COMPLETED").length;
      const onTrack = checkIns.filter(ci => ci.status === "ON_TRACK").length;
      const notStarted = checkIns.filter(ci => ci.status === "NOT_STARTED").length;
      const total = checkIns.length;
      const avgScore = total > 0
        ? Math.round(checkIns.reduce((sum, ci) => {
            return sum + (ci.actualAchievement ? ci.actualAchievement : 0);
          }, 0) / total)
        : 0;

      return { quarter, completed, onTrack, notStarted, total, avgScore };
    });

    // 2. Goal status breakdown
    const allCheckIns = allGoals.flatMap(g => g.checkIns.filter(ci => ci.quarter === "Q1"));
    const statusBreakdown = [
      { name: "Completed", value: allCheckIns.filter(ci => ci.status === "COMPLETED").length, color: "#22c55e" },
      { name: "On Track", value: allCheckIns.filter(ci => ci.status === "ON_TRACK").length, color: "#f59e0b" },
      { name: "Not Started", value: allCheckIns.filter(ci => ci.status === "NOT_STARTED").length, color: "#ef4444" },
      { name: "No Check-in", value: allGoals.filter(g => g.checkIns.length === 0).length, color: "#d1d5db" },
    ].filter(s => s.value > 0);

    // 3. Thrust area breakdown
    const thrustAreaMap: Record<string, { goals: number; avgWeightage: number }> = {};
    allGoals.forEach(g => {
      if (!thrustAreaMap[g.thrustArea]) thrustAreaMap[g.thrustArea] = { goals: 0, avgWeightage: 0 };
      thrustAreaMap[g.thrustArea].goals++;
      thrustAreaMap[g.thrustArea].avgWeightage += g.weightage;
    });
    const thrustAreaData = Object.entries(thrustAreaMap).map(([name, data]) => ({
      name,
      goals: data.goals,
      avgWeightage: data.goals > 0 ? Math.round(data.avgWeightage / data.goals) : 0,
    }));

    // 4. Completion rate by employee (for manager/admin)
    const employeeCompletion = goalSheets.map(sheet => {
      const sheetGoals = sheet.goals;
      const q1CheckIns = sheetGoals.flatMap(g => g.checkIns.filter(ci => ci.quarter === "Q1"));
      const rate = sheetGoals.length > 0 ? Math.round((q1CheckIns.filter(ci => ci.status === "COMPLETED").length / sheetGoals.length) * 100) : 0;
      return {
        name: sheet.employee.user.name || "Unknown",
        rate,
        totalGoals: sheetGoals.length,
        completed: q1CheckIns.filter(ci => ci.status === "COMPLETED").length,
      };
    });

    return NextResponse.json({
      quarterlyTrend,
      statusBreakdown,
      thrustAreaData,
      employeeCompletion,
      totalGoals: allGoals.length,
      totalSheets: goalSheets.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
