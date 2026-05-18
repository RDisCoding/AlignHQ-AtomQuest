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

    let members;

    if (session.user.role === "MANAGER") {
      const managerProfile = await prisma.employeeProfile.findUnique({
        where: { userId: session.user.id }
      });

      if (!managerProfile) return NextResponse.json([], { status: 200 });

      members = await prisma.employeeProfile.findMany({
        where: { managerId: managerProfile.id },
        include: {
          user: { select: { name: true, email: true } }
        }
      });
    } else {
      // ADMIN can see all employees
      members = await prisma.employeeProfile.findMany({
        where: { user: { role: "EMPLOYEE" } },
        include: {
          user: { select: { name: true, email: true } }
        }
      });
    }

    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
