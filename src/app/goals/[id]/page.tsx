"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GoalSheetViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [sheet, setSheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSheet() {
      try {
        const res = await fetch(`/api/team/goals/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSheet(data);
        }
      } catch (error) {
        console.error("Failed to fetch goal sheet", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSheet();
  }, [id]);

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!sheet) return <div className="p-12 text-center text-red-500">Goal sheet not found</div>;

  const totalWeightage = sheet.goals.reduce((sum: number, g: any) => sum + (parseFloat(g.weightage) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/goals">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goal Sheet Details</h1>
          <p className="text-gray-500 mt-1">Period: {sheet.period} • Status: <span className="font-semibold text-gray-700">{sheet.status}</span></p>
        </div>
        <div className="ml-auto">
          <div className="px-4 py-2 rounded-lg border font-medium bg-gray-50 text-gray-700 border-gray-200">
            Total Weightage: {totalWeightage}%
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {sheet.goals.map((goal: any, index: number) => (
          <Card key={goal.id} className="border border-gray-200 shadow-sm relative overflow-visible">
            <div className="absolute -left-3 -top-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
              {index + 1}
            </div>
            
            <CardHeader className="pb-4 pt-6">
              <CardTitle className="text-lg flex items-center gap-2">
                {goal.title}
                {goal.sharedGoalId && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-normal">Shared Goal</span>}
              </CardTitle>
              <p className="text-sm text-gray-500">{goal.description || 'No description provided'}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Thrust Area</span>
                  <p className="font-medium">{goal.thrustArea}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">UoM Type</span>
                  <p className="font-medium text-sm">{goal.uomType}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Target</span>
                  <p className="font-medium text-lg text-gray-900">{goal.target}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Weightage</span>
                  <p className="font-medium text-lg text-gray-900">{goal.weightage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
