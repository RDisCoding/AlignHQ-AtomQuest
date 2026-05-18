"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type GoalSheet = {
  id: string;
  period: string;
  status: string;
  goals: Array<{
    id: string;
    title: string;
    weightage: number;
    target: number;
    uomType: string;
    checkIns: Array<{
      id: string;
      quarter: string;
      actualAchievement: number | null;
      status: string;
    }>;
  }>;
};

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const CURRENT_QUARTER = "Q1"; // Could be made dynamic

export default function CheckInsPage() {
  const [goalSheets, setGoalSheets] = useState<GoalSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGoals() {
      try {
        const res = await fetch("/api/check-ins");
        if (res.ok) setGoalSheets(await res.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchGoals();
  }, []);

  const activeSheets = goalSheets.filter(s => s.status === "LOCKED");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quarterly Check-ins</h1>
          <p className="text-gray-500 mt-1">Log your actual achievement against targets</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg text-sm text-blue-700 font-medium">
          <Clock className="h-4 w-4" />
          Active Period: <span className="font-bold ml-1">{CURRENT_QUARTER} 2024</span>
        </div>
      </div>

      {/* Quarter timeline */}
      <div className="grid grid-cols-4 gap-4">
        {QUARTERS.map(q => (
          <div key={q} className={`p-4 rounded-xl border text-center transition-all ${q === CURRENT_QUARTER ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200'}`}>
            <div className="font-bold text-lg">{q}</div>
            <div className={`text-xs mt-1 ${q === CURRENT_QUARTER ? 'text-blue-100' : 'text-gray-400'}`}>
              {q === "Q1" ? "Jul" : q === "Q2" ? "Oct" : q === "Q3" ? "Jan" : "Mar"} 2024
            </div>
            {q === CURRENT_QUARTER && <div className="mt-2 text-xs font-semibold bg-blue-500 rounded-full px-2 py-0.5 inline-block">ACTIVE</div>}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : activeSheets.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
          <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No approved goal sheets</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Your goal sheet must be approved and locked by your manager before you can log check-ins.</p>
          <Link href="/goals" className="mt-4 inline-block">
            <Button variant="outline">View My Goals</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {activeSheets.map(sheet => (
            <div key={sheet.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-lg text-gray-900">Goal Sheet — {sheet.period}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{sheet.goals.length} goals • {CURRENT_QUARTER} check-in window is open</p>
                </div>
                <Link href={`/check-ins/${sheet.id}?quarter=${CURRENT_QUARTER}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Update Check-in <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="divide-y">
                {sheet.goals.map(goal => {
                  const currentCheckIn = goal.checkIns?.find(ci => ci.quarter === CURRENT_QUARTER);
                  const progress = currentCheckIn?.actualAchievement != null
                    ? Math.min(100, Math.round((currentCheckIn.actualAchievement / goal.target) * 100))
                    : 0;

                  return (
                    <div key={goal.id} className="p-5 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{goal.title}</span>
                          <span className="text-sm text-gray-400">{goal.weightage}% weight</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10 text-right">{progress}%</span>
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Target: <b>{goal.target}</b></span>
                          <span>Actual: <b>{currentCheckIn?.actualAchievement ?? '—'}</b></span>
                        </div>
                      </div>
                      <div className="w-24 text-center">
                        {!currentCheckIn ? (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Not Started</span>
                        ) : currentCheckIn.status === "COMPLETED" ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 justify-center"><CheckCircle2 className="w-3 h-3"/>Done</span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">On Track</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
