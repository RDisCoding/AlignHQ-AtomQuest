import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const goalSheet = await prisma.goalSheet.findUnique({ where: { id } });
    if (!goalSheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Unlock the goal sheet
      await tx.goalSheet.update({
        where: { id },
        data: { status: "SUBMITTED" }, // Put back to SUBMITTED so manager can re-approve
      });

      // Log the unlock action in audit trail
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "GOAL_SHEET_UNLOCKED",
          previousValue: "LOCKED",
          newValue: "SUBMITTED",
        }
      });
    });

    return NextResponse.json({ message: "Goal sheet unlocked successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
