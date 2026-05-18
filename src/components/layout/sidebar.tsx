"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Target,
  CheckCircle2,
  Users,
  Network,
  ShieldCheck,
  FileDown,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { href: "/goals", label: "My Goals", icon: Target, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { href: "/check-ins", label: "Check-ins", icon: CheckCircle2, roles: ["EMPLOYEE"] },
  { href: "/team", label: "My Team", icon: Users, roles: ["MANAGER", "ADMIN"] },
  { href: "/team/shared-goals", label: "Shared Goals", icon: Network, roles: ["MANAGER", "ADMIN"] },
  { href: "/reports", label: "Reports", icon: FileDown, roles: ["MANAGER", "ADMIN"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["MANAGER", "ADMIN"] },
  { href: "/admin", label: "Admin Panel", icon: ShieldCheck, roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "";

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-gray-950 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Target className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-base font-bold tracking-wide">AtomQuest</span>
          <div className="text-xs text-gray-400">Goal Tracker</div>
        </div>
      </div>

      {/* Role Badge */}
      {role && (
        <div className="mx-4 mt-4 mb-2 py-1.5 px-3 bg-gray-800 rounded-lg text-center">
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            {role === "ADMIN" ? "🛡️ Admin" : role === "MANAGER" ? "👔 Manager" : "👤 Employee"}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 py-3 flex-1">
        {visibleItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 truncate">{session?.user?.email}</div>
        <div className="text-xs text-gray-400 truncate font-medium mt-0.5">{session?.user?.name}</div>
      </div>
    </aside>
  );
}
