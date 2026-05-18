"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type GoalSheet = {
  id: string;
  period: string;
  goals: Array<{
    id: string;
    title: string;
    description: string;
    weightage: number;
    target: number;
    uomType: string;
    sharedGoalId: string | null;
    sharedGoal: { primaryOwner: { userId: string } } | null;
    checkIns: Array<{
      id: string;
      quarter: string;
      actualAchievement: number | null;
      status: string;
    }>;
  }>;
};

function computeScore(uomType: string, target: number, actual: number): number {
  if (!actual || !target) return 0;
  switch (uomType) {
    case "NUMERIC_MAX":
    case "PERCENTAGE_MAX":
      return Math.min(100, Math.round((actual / target) * 100));
    case "NUMERIC_MIN":
    case "PERCENTAGE_MIN":
      return target === 0 ? 0 : Math.min(100, Math.round((target / actual) * 100));
    case "ZERO_BASED":
      return actual === 0 ? 100 : 0;
    case "TIMELINE":
      return actual <= target ? 100 : 0;
    default:
      return 0;
  }
}

export default function CheckInDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const quarter = searchParams.get("quarter") || "Q1";
  const router = useRouter();
  const { data: session } = useSession();

  const [sheet, setSheet] = useState<GoalSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state: { goalId -> { actual, status } }
  const [entries, setEntries] = useState<Record<string, { actual: string; status: string }>>({});

  useEffect(() => {
    async function fetchSheet() {
      try {
        const res = await fetch(`/api/check-ins/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSheet(data);
          // Pre-fill existing check-ins
          const initial: Record<string, { actual: string; status: string }> = {};
          data.goals.forEach((g: any) => {
            const existing = g.checkIns?.find((ci: any) => ci.quarter === quarter);
            initial[g.id] = {
              actual: existing?.actualAchievement?.toString() ?? "",
              status: existing?.status ?? "NOT_STARTED",
            };
          });
          setEntries(initial);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchSheet();
  }, [id, quarter]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/check-ins/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarter, entries }),
      });

      if (res.ok) {
        toast.success("Check-in saved successfully!");
        router.push("/check-ins");
      } else {
        toast.error("Failed to save check-in.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!sheet) return <div className="p-12 text-center text-red-500">Goal sheet not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/check-ins">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{quarter} Check-in</h1>
          <p className="text-gray-500 mt-0.5">Period: {sheet.period} • Log your actual achievements below</p>
        </div>
      </div>

      <div className="space-y-4">
        {sheet.goals.map((goal) => {
          const entry = entries[goal.id] || { actual: "", status: "NOT_STARTED" };
          const actualNum = parseFloat(entry.actual);
          const score = !isNaN(actualNum) ? computeScore(goal.uomType, goal.target, actualNum) : 0;
          const isShared = !!goal.sharedGoalId;
          const isPrimaryOwner = isShared ? goal.sharedGoal?.primaryOwner?.userId === session?.user?.id : true;

          return (
            <Card key={goal.id} className={`border ${isShared ? 'border-l-4 border-l-purple-500' : ''}`}>
              <CardHeader className="pb-3 pt-5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{goal.title}
                      {isShared && <span className="ml-2 text-xs font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Shared</span>}
                    </CardTitle>
                    {goal.description && <p className="text-sm text-gray-500 mt-1">{goal.description}</p>}
                  </div>
                  <span className="text-sm text-gray-400">{goal.weightage}% weight</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg text-sm">
                  <div><span className="text-gray-500">UoM</span><p className="font-medium mt-0.5">{goal.uomType.replace(/_/g," ")}</p></div>
                  <div><span className="text-gray-500">Target</span><p className="font-medium mt-0.5">{goal.target}</p></div>
                  <div>
                    <span className="text-gray-500">Progress Score</span>
                    <p className={`font-bold text-lg mt-0.5 ${score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                      {score}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Actual Achievement *</Label>
                    <Input
                      type="number"
                      value={entry.actual}
                      onChange={e => setEntries(prev => ({ ...prev, [goal.id]: { ...prev[goal.id], actual: e.target.value } }))}
                      placeholder={`Target: ${goal.target}`}
                      disabled={!isPrimaryOwner}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      value={entry.status}
                      onValueChange={val => setEntries(prev => ({ ...prev, [goal.id]: { ...prev[goal.id], status: val as string } }))}
                      disabled={!isPrimaryOwner}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                        <SelectItem value="ON_TRACK">On Track</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                {!isPrimaryOwner && (
                  <p className="text-xs text-amber-600 mt-2">
                    This is a shared goal. Only the primary owner can log check-in updates.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Check-in"}
        </Button>
      </div>
    </div>
  );
}
