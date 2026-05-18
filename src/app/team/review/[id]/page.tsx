"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

export default function ReviewGoalSheet({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [sheet, setSheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const updateGoal = (goalId: string, field: string, value: string) => {
    setSheet((prev: any) => ({
      ...prev,
      goals: prev.goals.map((g: any) => g.id === goalId ? { ...g, [field]: value } : g)
    }));
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    // Validate weightage before approving
    if (action === 'approve') {
      const totalWeightage = sheet.goals.reduce((sum: number, g: any) => sum + (parseFloat(g.weightage) || 0), 0);
      if (Math.abs(totalWeightage - 100) > 0.01) {
        toast.error(`Total weightage must be exactly 100%. Current: ${totalWeightage}%`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/team/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action,
          goals: sheet.goals // Send potentially modified goals back
        }),
      });

      if (!res.ok) throw new Error(`Failed to ${action} goals`);

      toast.success(`Goal sheet ${action === 'approve' ? 'approved and locked' : 'returned for rework'} successfully!`);
      router.push("/team");
    } catch (error) {
      toast.error(`An error occurred while trying to ${action}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!sheet) return <div className="p-12 text-center text-red-500">Goal sheet not found</div>;

  const totalWeightage = sheet.goals.reduce((sum: number, g: any) => sum + (parseFloat(g.weightage) || 0), 0);
  const isReadOnly = sheet.status !== "SUBMITTED";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/team">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Goal Sheet</h1>
          <p className="text-gray-500 mt-1">
            Employee: <span className="font-medium text-gray-900">{sheet.employee?.user?.name || sheet.employee?.user?.email}</span> • Period: {sheet.period}
          </p>
        </div>
        <div className="ml-auto">
          <div className={`px-4 py-2 rounded-lg border font-medium ${totalWeightage === 100 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            Total Weightage: {totalWeightage}%
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {sheet.goals.map((goal: any, index: number) => (
          <Card key={goal.id} className="border border-gray-200 shadow-sm relative overflow-visible">
            <div className="absolute -left-3 -top-3 w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
              {index + 1}
            </div>
            
            <CardHeader className="pb-4 pt-6">
              <CardTitle className="text-lg">{goal.title}</CardTitle>
              <p className="text-sm text-gray-500">{goal.description || 'No description provided'}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Thrust Area</span>
                  <p className="font-medium">{goal.thrustArea}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">UoM Type</span>
                  <p className="font-medium text-sm">{goal.uomType}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Input 
                    type="number" 
                    value={goal.target} 
                    onChange={(e) => updateGoal(goal.id, "target", e.target.value)} 
                    disabled={isReadOnly}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Weightage (%)</Label>
                  <Input 
                    type="number" 
                    value={goal.weightage} 
                    onChange={(e) => updateGoal(goal.id, "weightage", e.target.value)} 
                    disabled={isReadOnly}
                    className="bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isReadOnly && (
          <div className="flex justify-end gap-4 pt-6 border-t mt-8">
            <Button 
              type="button" 
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              disabled={isSubmitting}
              onClick={() => handleAction('reject')}
            >
              <XCircle className="h-4 w-4 mr-2" /> Return for Rework
            </Button>
            <Button 
              type="button" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || totalWeightage !== 100}
              onClick={() => handleAction('approve')}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> 
              {isSubmitting ? 'Processing...' : 'Approve & Lock Goals'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
