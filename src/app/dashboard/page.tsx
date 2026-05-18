"use client";

import { useSession } from "next-auth/react";
import { CheckCircle, Target, Clock, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

type Stat = {
  title: string;
  value: string;
};

type Activity = {
  id: string;
  text: string;
  date: string;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stat[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats || []);
          setActivities(data.recentActivity || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const icons = [
    <Target key="1" className="text-blue-500" />,
    <CheckCircle key="2" className="text-green-500" />,
    <Clock key="3" className="text-amber-500" />,
    <AlertTriangle key="4" className="text-red-500" />
  ];

  const colors = [
    "border-blue-200 bg-blue-50",
    "border-green-200 bg-green-50",
    "border-amber-200 bg-amber-50",
    "border-red-200 bg-red-50"
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your current goal period.</p>
        </div>
        <div className="bg-white border rounded-lg px-4 py-2 text-sm shadow-sm">
          Current Period: <span className="font-semibold text-blue-600">2024-Q1</span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <StatCard 
                key={stat.title}
                title={stat.title} 
                value={stat.value} 
                icon={icons[i % icons.length]} 
                color={colors[i % colors.length]}
              />
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 mt-8">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            {activities.length === 0 ? (
              <div className="text-gray-500 text-sm italic">
                No recent activity to show yet.
              </div>
            ) : (
              <ul className="space-y-4">
                {activities.map(activity => (
                  <li key={activity.id} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-gray-800 flex-1">{activity.text}</span>
                    <span className="text-gray-400 text-xs">{new Date(activity.date).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className={`p-6 rounded-xl border ${color} bg-opacity-50`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-gray-800">{value}</p>
        </div>
        <div className="p-3 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}
