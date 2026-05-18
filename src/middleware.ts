import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Example role-based protection
    // If an employee tries to access an admin-only route
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // If an employee tries to access a manager-only route
    if (path.startsWith("/team") && token?.role !== "MANAGER" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/goals/:path*",
    "/check-ins/:path*",
    "/team/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ]
}
