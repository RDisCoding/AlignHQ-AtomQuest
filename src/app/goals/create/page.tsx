"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Send, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type GoalInput = {
  id: string;
  title: string;
  description: string;
  thrustArea: string;
  uomType: string;
  target: string;
  weightage: string;
  sharedGoalId?: string | null;
};

export default function CreateGoalSheet() {
  const router = useRouter();
  const [goals, setGoals] = useState<GoalInput[]>([{
    id: crypto.randomUUID(),
    title: "",
    description: "",
    thrustArea: "",
    uomType: "NUMERIC_MAX",
    target: "",
    weightage: ""
  }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingSheetId, setExistingSheetId] = useState<string | null>(null);

  // Load existing draft sheet if one exists (with shared goals already pushed)
  useEffect(() => {
    async function loadExisting() {
      try {
        const res = await fetch("/api/goals");
        if (res.ok) {
          const sheets = await res.json();
          const draftSheet = sheets.find((s: any) => s.status === "DRAFT" && s.period === "2024-Q1");
          if (draftSheet && draftSheet.goals.length > 0) {
            setExistingSheetId(draftSheet.id);
            setGoals(draftSheet.goals.map((g: any) => ({
              id: g.id,
              title: g.title,
              description: g.description || "",
              thrustArea: g.thrustArea,
              uomType: g.uomType,
              target: g.target.toString(),
              weightage: g.weightage.toString(),
              sharedGoalId: g.sharedGoalId || null,
            })));
          }
        }
      } catch {}
    }
    loadExisting();
  }, []);

  const addGoal = () => {
    if (goals.length >= 8) {
      toast.error("Maximum 8 goals allowed.");
      return;
    }
    setGoals([...goals, {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      thrustArea: "",
      uomType: "NUMERIC_MAX",
      target: "",
      weightage: ""
    }]);
  };

  const removeGoal = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (goal?.sharedGoalId) {
      toast.error("Shared goals cannot be removed. They are managed by your manager.");
      return;
    }
    if (goals.filter(g => !g.sharedGoalId).length <= 1 && !goal?.sharedGoalId) {
      toast.error("At least one personal goal is required.");
      return;
    }
    setGoals(goals.filter(g => g.id !== id));
  };

  const updateGoal = (id: string, field: keyof GoalInput, value: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const validateGoals = () => {
    let totalWeightage = 0;
    
    for (const goal of goals) {
      if (!goal.title || !goal.thrustArea || !goal.target || !goal.weightage) {
        toast.error("Please fill in all required fields for each goal.");
        return false;
      }
      
      const weight = parseFloat(goal.weightage);
      if (isNaN(weight) || weight < 10) {
        toast.error(`Goal "${goal.title || 'Untitled'}" must have at least 10% weightage.`);
        return false;
      }
      
      totalWeightage += weight;
    }
    
    if (Math.abs(totalWeightage - 100) > 0.01) {
      toast.error(`Total weightage must be exactly 100%. Current: ${totalWeightage}%`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateGoals()) return;
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals, period: "2024-Q1" }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit goals");
      }
      
      toast.success("Goal sheet submitted successfully!");
      router.push("/goals");
    } catch (error: any) {
      toast.error(error.message || "An error occurred while submitting.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalWeightage = goals.reduce((sum, g) => sum + (parseFloat(g.weightage) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Goal Sheet</h1>
          <p className="text-gray-500 mt-1">Define your objectives for Q1 2024</p>
        </div>
        <div className={`px-4 py-2 rounded-lg border font-medium ${totalWeightage === 100 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          Total Weightage: {totalWeightage}%
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {goals.map((goal, index) => {
          const isShared = !!goal.sharedGoalId;
          return (
            <Card key={goal.id} className={`border shadow-sm relative overflow-visible ${isShared ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200'}`}>
              <div className={`absolute -left-3 -top-3 w-8 h-8 ${isShared ? 'bg-purple-600' : 'bg-blue-600'} text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm`}>
                {index + 1}
              </div>
              
              <CardHeader className="pb-4 pt-6">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {isShared && <Lock className="h-4 w-4 text-purple-500" />}
                    {isShared ? "Shared Goal (Read-only)" : "Goal Details"}
                    {isShared && <span className="text-xs font-normal text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Shared KPI</span>}
                  </CardTitle>
                  {!isShared && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 -mt-2 -mr-2"
                      onClick={() => removeGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Goal Title *</Label>
                    <Input 
                      value={goal.title} 
                      onChange={(e) => updateGoal(goal.id, "title", e.target.value)} 
                      placeholder="e.g., Increase Q1 Sales"
                      required
                      disabled={isShared}
                      className={isShared ? "bg-gray-100" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Thrust Area *</Label>
                    <Input 
                      value={goal.thrustArea} 
                      onChange={(e) => updateGoal(goal.id, "thrustArea", e.target.value)} 
                      placeholder="e.g., Revenue Growth"
                      required
                      disabled={isShared}
                      className={isShared ? "bg-gray-100" : ""}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    value={goal.description} 
                    onChange={(e) => updateGoal(goal.id, "description", e.target.value)} 
                    placeholder="Optional details about this goal..."
                    disabled={isShared}
                    className={isShared ? "bg-gray-100" : ""}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Unit of Measurement (UoM) *</Label>
                    <Select 
                      value={goal.uomType} 
                      onValueChange={(value) => updateGoal(goal.id, "uomType", value || "")}
                      disabled={isShared}
                    >
                      <SelectTrigger className={isShared ? "bg-gray-100" : ""}>
                        <SelectValue placeholder="Select UoM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NUMERIC_MAX">Numeric (Higher is better)</SelectItem>
                        <SelectItem value="NUMERIC_MIN">Numeric (Lower is better)</SelectItem>
                        <SelectItem value="PERCENTAGE_MAX">Percentage (Higher is better)</SelectItem>
                        <SelectItem value="PERCENTAGE_MIN">Percentage (Lower is better)</SelectItem>
                        <SelectItem value="TIMELINE">Timeline (Date-based)</SelectItem>
                        <SelectItem value="ZERO_BASED">Zero-Based (0 = Success)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Target *</Label>
                    <Input 
                      type="number" 
                      value={goal.target} 
                      onChange={(e) => updateGoal(goal.id, "target", e.target.value)} 
                      placeholder="e.g., 50000"
                      required
                      disabled={isShared}
                      className={isShared ? "bg-gray-100" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Weightage (%) * {isShared && <span className="text-purple-600 text-xs">(Editable)</span>}</Label>
                    <Input 
                      type="number" 
                      min="10"
                      max="100"
                      value={goal.weightage} 
                      onChange={(e) => updateGoal(goal.id, "weightage", e.target.value)} 
                      placeholder="e.g., 25"
                      required
                    />
                    {parseFloat(goal.weightage) < 10 && goal.weightage !== "" && (
                      <p className="text-xs text-red-500">Minimum 10% required</p>
                    )}
                    {isShared && (
                      <p className="text-xs text-purple-500">You can adjust the weightage for this shared goal</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <div className="flex justify-center py-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={addGoal}
            className="text-blue-600 hover:text-blue-700 font-medium"
            disabled={goals.length >= 8}
          >
            <Plus className="h-5 w-5 mr-2" />
            {goals.length >= 8 ? 'Maximum 8 goals reached' : 'Add Another Goal'}
          </Button>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting || totalWeightage !== 100}>
            <Send className="h-4 w-4 mr-2" /> 
            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </div>
      </form>
    </div>
  );
}
