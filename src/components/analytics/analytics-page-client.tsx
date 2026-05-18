"use client";

import { useEffect, useState } from "react";
import AnalyticsClient from "./analytics-client";

export default function AnalyticsPageClient() {
  const [data, setData] = useState<any>({
    quarterlyTrend: [],
    statusBreakdown: [],
    thrustAreaData: [],
    employeeCompletion: [],
    totalGoals: 0,
    totalSheets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  }

  return <AnalyticsClient data={data} />;
}
