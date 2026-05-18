import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employeeProfile = await prisma.employeeProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!employeeProfile) return NextResponse.json([], { status: 200 });

    const goalSheets = await prisma.goalSheet.findMany({
      where: { employeeId: employeeProfile.id },
      include: {
        goals: {
          include: { checkIns: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(goalSheets, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
