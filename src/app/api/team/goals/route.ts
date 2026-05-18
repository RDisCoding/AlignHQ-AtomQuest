import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let whereClause: any = {};

    if (session.user.role === "MANAGER") {
      const managerProfile = await prisma.employeeProfile.findUnique({
        where: { userId: session.user.id }
      });

      if (!managerProfile) return NextResponse.json([], { status: 200 });

      // Only show goal sheets from THIS manager's team
      whereClause = {
        employee: { managerId: managerProfile.id }
      };
    }
    // ADMIN sees all goal sheets (no additional filter)

    const goalSheets = await prisma.goalSheet.findMany({
      where: whereClause,
      include: { 
        employee: {
          include: { user: { select: { name: true, email: true } } }
        },
        goals: {
          include: { sharedGoal: { select: { id: true, title: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(goalSheets, { status: 200 });
  } catch (error) {
    console.error("Error fetching team goals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
