"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, AlertCircle, FileSignature, CheckCircle2, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type GoalSheet = {
  id: string;
  employeeId: string;
  employee: { user: { name: string, email: string } };
  period: string;
  status: string;
  goals: any[];
  createdAt: string;
};

export default function TeamPage() {
  const [goalSheets, setGoalSheets] = useState<GoalSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamGoals() {
      try {
        const res = await fetch("/api/team/goals");
        if (res.ok) {
          const data = await res.json();
          setGoalSheets(data);
        }
      } catch (error) {
        console.error("Failed to fetch team goals", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTeamGoals();
  }, []);

  const pendingSheets = goalSheets.filter(s => s.status === "SUBMITTED");
  const lockedSheets = goalSheets.filter(s => s.status === "LOCKED");
  const draftSheets = goalSheets.filter(s => s.status === "DRAFT");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LOCKED": return <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>;
      case "SUBMITTED": return <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pending</span>;
      case "DRAFT": return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">Draft</span>;
      default: return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
        <p className="text-gray-500 mt-1">Review and manage your team's objectives</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{pendingSheets.length}</div>
          <div className="text-xs text-amber-600 mt-1">Pending Approval</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{lockedSheets.length}</div>
          <div className="text-xs text-green-600 mt-1">Approved & Locked</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{draftSheets.length}</div>
          <div className="text-xs text-gray-500 mt-1">Still in Draft</div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileSignature className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Pending Approvals</h2>
        </div>

        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : pendingSheets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto text-gray-300 mb-3" />
            <p>No goal sheets are currently pending your approval.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingSheets.map(sheet => (
              <div key={sheet.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="mb-4 md:mb-0">
                  <h3 className="font-medium text-gray-900">{sheet.employee?.user?.name || sheet.employee?.user?.email || 'Unknown Employee'}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span>Period: {sheet.period}</span>
                    <span>•</span>
                    <span>{sheet.goals?.length || 0} goals</span>
                    <span>•</span>
                    <span>Submitted: {new Date(sheet.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link href={`/team/review/${sheet.id}`}>
                  <Button className="w-full md:w-auto bg-amber-600 hover:bg-amber-700">Review Goals</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Team Members */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold">All Team Goal Sheets</h2>
        </div>
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : goalSheets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-8 w-8 mx-auto text-gray-300 mb-3" />
            <p>No team members have created goal sheets yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Period</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Goals</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {goalSheets.map(sheet => (
                  <tr key={sheet.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{sheet.employee?.user?.name}</div>
                      <div className="text-xs text-gray-400">{sheet.employee?.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sheet.period}</td>
                    <td className="px-4 py-3 text-gray-600">{sheet.goals?.length || 0}</td>
                    <td className="px-4 py-3">{getStatusBadge(sheet.status)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/team/review/${sheet.id}`}>
                        <Button size="sm" variant="outline">
                          <FileText className="h-3.5 w-3.5 mr-1.5" />
                          {sheet.status === "SUBMITTED" ? "Review" : "View"}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
