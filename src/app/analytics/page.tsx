import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnalyticsPageClient from "@/components/analytics/analytics-page-client";
import { BarChart3 } from "lucide-react";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Goal achievement trends and performance insights</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-medium">
          <BarChart3 className="h-4 w-4" />
          Live Data
        </div>
      </div>
      <AnalyticsPageClient />
    </div>
  );
}
