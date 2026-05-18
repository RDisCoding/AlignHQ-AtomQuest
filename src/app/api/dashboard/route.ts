import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    const userId = session.user.id;

    let stats: { title: string; value: string }[] = [];
    let recentActivity: { id: string; text: string; date: Date }[] = [];

    if (role === "EMPLOYEE") {
      const profile = await prisma.employeeProfile.findUnique({ where: { userId } });
      if (profile) {
        const goalSheet = await prisma.goalSheet.findFirst({
          where: { employeeId: profile.id, period: "2024-Q1" },
          include: { goals: { include: { checkIns: true } } }
        });

        const totalGoals = goalSheet?.goals.length || 0;
        const totalWeightage = goalSheet?.goals.reduce((acc, g) => acc + g.weightage, 0) || 0;
        
        let status = "Not Created";
        if (goalSheet) status = goalSheet.status;

        const currentQuarter = "Q1";
        const goalsNeedingCheckIn = goalSheet?.goals.filter(g => {
            const checkIn = g.checkIns.find(ci => ci.quarter === currentQuarter);
            return !checkIn || checkIn.actualAchievement === null;
        }).length || 0;

        stats = [
          { title: "Total Goals", value: totalGoals.toString() },
          { title: "Total Weightage", value: `${totalWeightage}%` },
          { title: "Sheet Status", value: status },
          { title: "Check-ins Due", value: goalsNeedingCheckIn.toString() },
        ];

        recentActivity = goalSheet ? [
          { id: "1", text: `Goal sheet updated to ${status}`, date: goalSheet.updatedAt }
        ] : [];
      }
    } else if (role === "MANAGER") {
      const profile = await prisma.employeeProfile.findUnique({ where: { userId } });
      if (profile) {
        const teamMembers = await prisma.employeeProfile.count({ where: { managerId: profile.id } });
        const pendingApprovals = await prisma.goalSheet.count({ 
          where: { employee: { managerId: profile.id }, status: "SUBMITTED" } 
        });
        const lockedSheets = await prisma.goalSheet.count({ 
          where: { employee: { managerId: profile.id }, status: "LOCKED" } 
        });
        
        stats = [
          { title: "Team Members", value: teamMembers.toString() },
          { title: "Pending Approval", value: pendingApprovals.toString() },
          { title: "Locked Sheets", value: lockedSheets.toString() },
          { title: "Draft Sheets", value: (teamMembers - lockedSheets - pendingApprovals).toString() },
        ];
      }
    } else if (role === "ADMIN") {
      const totalEmployees = await prisma.user.count({ where: { role: "EMPLOYEE" } });
      const pendingApprovals = await prisma.goalSheet.count({ where: { status: "SUBMITTED" } });
      const lockedSheets = await prisma.goalSheet.count({ where: { status: "LOCKED" } });
      
      stats = [
        { title: "Total Employees", value: totalEmployees.toString() },
        { title: "Pending Approval", value: pendingApprovals.toString() },
        { title: "Locked Sheets", value: lockedSheets.toString() },
        { title: "Draft Sheets", value: (totalEmployees - lockedSheets - pendingApprovals).toString() },
      ];
      
      const logs = await prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } }
      });
      
      recentActivity = logs.map(l => ({
        id: l.id,
        text: `${l.user?.name} performed ${l.action}`,
        date: l.createdAt
      }));
    }

    return NextResponse.json({ stats, recentActivity });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
