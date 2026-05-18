"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Target, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type GoalSheet = {
  id: string;
  period: string;
  status: string;
  goals: any[];
  createdAt: string;
};

export default function MyGoalsPage() {
  const [goalSheets, setGoalSheets] = useState<GoalSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGoals() {
      try {
        const res = await fetch("/api/goals");
        if (res.ok) {
          const data = await res.json();
          setGoalSheets(data);
        }
      } catch (error) {
        console.error("Failed to fetch goals", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGoals();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Goals</h1>
          <p className="text-gray-500 mt-1">Manage your objective sheets</p>
        </div>
        <Link href="/goals/create">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Goal Sheet
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : goalSheets.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No goals set for this period</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">
            You haven't submitted any goal sheets yet. Create your first goal sheet to align with the company objectives.
          </p>
          <Link href="/goals/create">
            <Button>Start Goal Setting</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalSheets.map(sheet => (
            <div key={sheet.id} className="bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-lg">{sheet.period}</h3>
                </div>
                {sheet.status === "LOCKED" && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>}
                {sheet.status === "SUBMITTED" && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Pending</span>}
                {sheet.status === "DRAFT" && <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">Draft</span>}
                {sheet.status === "LOCKED" && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">Locked</span>}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Goals</span>
                  <span className="font-medium text-gray-900">{sheet.goals?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Submitted On</span>
                  <span className="font-medium text-gray-900">{new Date(sheet.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="text-xs text-gray-400">ID: {sheet.id.split('-')[0]}...</span>
                <Link href={`/goals/${sheet.id}`}>
                  <Button variant="outline" size="sm">View Details</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
