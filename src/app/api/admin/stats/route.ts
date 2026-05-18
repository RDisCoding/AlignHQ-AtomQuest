import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [totalEmployees, totalSheets, lockedSheets, submittedSheets, draftSheets] = await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.goalSheet.count(),
      prisma.goalSheet.count({ where: { status: { in: ["LOCKED", "APPROVED"] } } }),
      prisma.goalSheet.count({ where: { status: "SUBMITTED" } }),
      prisma.goalSheet.count({ where: { status: "DRAFT" } }),
    ]);

    return NextResponse.json({ totalEmployees, totalSheets, lockedSheets, submittedSheets, draftSheets });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
