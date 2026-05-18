import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id },
      include: {
        goals: true,
        employee: {
          include: { user: { select: { name: true, email: true } } }
        }
      }
    });

    if (!goalSheet) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(goalSheet, { status: 200 });
  } catch (error) {
    console.error("Error fetching goal sheet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check - only managers/admins should do this
    if (session.user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action, goals } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Start a transaction for updating goals and the goal sheet status
    await prisma.$transaction(async (tx) => {
      // 1. Update potentially modified goals (inline editing)
      if (goals && Array.isArray(goals)) {
        for (const goal of goals) {
          await tx.goal.update({
            where: { id: goal.id },
            data: {
              target: parseFloat(goal.target),
              weightage: parseFloat(goal.weightage),
            }
          });
          
          // Ideally, log this to AuditLog if changed
        }
      }

      // 2. Update GoalSheet status to LOCKED if approved, or DRAFT if rejected
      const newStatus = action === 'approve' ? "LOCKED" : "DRAFT";
      
      await tx.goalSheet.update({
        where: { id },
        data: { status: newStatus }
      });
    });

    return NextResponse.json({ message: `Goals ${action === 'approve' ? 'locked' : 'rejected'}` }, { status: 200 });
  } catch (error) {
    console.error("Error updating goal sheet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
