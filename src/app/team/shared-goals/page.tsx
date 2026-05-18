"use client";

import { useState, useEffect } from "react";
import { Plus, Send, Network, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type TeamMember = {
  id: string;
  user: { name: string; email: string };
};

type SharedGoalForm = {
  title: string;
  description: string;
  thrustArea: string;
  uomType: string;
  target: string;
  primaryOwnerId: string;
  assignedEmployeeIds: string[];
};

export default function SharedGoalsPage() {
  const [sharedGoals, setSharedGoals] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<SharedGoalForm>({
    title: "",
    description: "",
    thrustArea: "",
    uomType: "NUMERIC_MAX",
    target: "",
    primaryOwnerId: "",
    assignedEmployeeIds: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [goalsRes, teamRes] = await Promise.all([
        fetch("/api/team/shared-goals"),
        fetch("/api/team/members")
      ]);
      if (goalsRes.ok) setSharedGoals(await goalsRes.json());
      if (teamRes.ok) {
        const members = await teamRes.json();
        setTeamMembers(members);
        setFormData((current) => ({
          ...current,
          assignedEmployeeIds: current.assignedEmployeeIds.length > 0 ? current.assignedEmployeeIds : members.map((member: TeamMember) => member.id),
          primaryOwnerId: current.primaryOwnerId || members[0]?.id || "",
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.primaryOwnerId) {
      toast.error("Please select a primary owner.");
      return;
    }
    if (formData.assignedEmployeeIds.length === 0) {
      toast.error("Please select at least one employee to receive the shared goal.");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/team/shared-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Shared Goal created and pushed to team members!");
        setIsCreating(false);
        setFormData({
          title: "",
          description: "",
          thrustArea: "",
          uomType: "NUMERIC_MAX",
          target: "",
          primaryOwnerId: "",
          assignedEmployeeIds: teamMembers.map((member) => member.id),
        });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create Shared Goal.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Shared Goals</h1>
          <p className="text-gray-500 mt-1">Create master KPIs and push them to your team.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="bg-purple-600 hover:bg-purple-700">
          {isCreating ? 'Cancel' : <><Plus className="h-4 w-4 mr-2" /> New Shared Goal</>}
        </Button>
      </div>

      {isCreating && (
        <Card className="border-purple-200 shadow-md">
          <CardHeader className="bg-purple-50 border-b pb-4 pt-6">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
              <Network className="h-5 w-5" />
              Create & Push New Shared Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Goal Title *</Label>
                  <Input 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                    placeholder="e.g., Department Revenue Target"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thrust Area *</Label>
                  <Input 
                    value={formData.thrustArea} 
                    onChange={e => setFormData({...formData, thrustArea: e.target.value})} 
                    required 
                    placeholder="e.g., Financial Performance"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unit of Measurement (UoM) *</Label>
                  <Select 
                    value={formData.uomType} 
                    onValueChange={value => setFormData({...formData, uomType: value || "NUMERIC_MAX"})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    value={formData.target} 
                    onChange={e => setFormData({...formData, target: e.target.value})} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Primary Owner *</Label>
                  <Select 
                    value={formData.primaryOwnerId} 
                    onValueChange={value => setFormData({...formData, primaryOwnerId: value || ""})}
                  >
                    <SelectTrigger><SelectValue placeholder="Select primary owner" /></SelectTrigger>
                    <SelectContent>
                      {teamMembers.filter(member => formData.assignedEmployeeIds.includes(member.id)).map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.user?.name || member.user?.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Select Employees *</Label>
                  <button
                    type="button"
                    className="text-xs font-medium text-purple-600 hover:text-purple-700"
                    onClick={() => setFormData({
                      ...formData,
                      assignedEmployeeIds: formData.assignedEmployeeIds.length === teamMembers.length ? [] : teamMembers.map((member) => member.id),
                      primaryOwnerId: formData.assignedEmployeeIds.length === teamMembers.length ? "" : formData.primaryOwnerId,
                    })}
                  >
                    {formData.assignedEmployeeIds.length === teamMembers.length ? "Clear all" : "Select all"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-auto rounded-xl border bg-gray-50 p-3">
                  {teamMembers.map((member) => {
                    const checked = formData.assignedEmployeeIds.includes(member.id);
                    return (
                      <label
                        key={member.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${checked ? "border-purple-300 bg-white" : "border-transparent bg-white/70 hover:border-gray-200"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const nextIds = checked
                              ? formData.assignedEmployeeIds.filter((employeeId) => employeeId !== member.id)
                              : [...formData.assignedEmployeeIds, member.id];

                            setFormData({
                              ...formData,
                              assignedEmployeeIds: nextIds,
                              primaryOwnerId: nextIds.includes(formData.primaryOwnerId) ? formData.primaryOwnerId : "",
                            });
                          }}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{member.user?.name || member.user?.email}</div>
                          <div className="text-xs text-gray-500">{member.user?.email}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Only the primary owner can log check-in progress for this goal. Their updates sync to everyone assigned here.
              </p>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                  <Send className="h-4 w-4 mr-2" /> 
                  {isSubmitting ? 'Pushing to Team...' : 'Push to Team'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>
      ) : sharedGoals.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-xl">
          <Network className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Shared Goals</h3>
          <p className="text-gray-500 mt-1">Create a shared goal to automatically push it to your team's goal sheets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sharedGoals.map((sg: any) => (
            <Card key={sg.id} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{sg.title}</CardTitle>
                <div className="text-xs font-semibold tracking-wider text-purple-600 uppercase">
                  {sg.thrustArea}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{sg.description || "No description"}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                    <span className="text-gray-500">Target</span>
                    <span className="font-bold text-gray-900">{sg.target}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                    <span className="text-gray-500 flex items-center gap-1"><User className="h-3 w-3" /> Primary Owner</span>
                    <span className="font-medium text-gray-900">{sg.primaryOwnerName || sg.primaryOwnerEmail || "—"}</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-400 flex justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Assigned to {sg.assignedCount || 0} employees
                  </span>
                  <span>{new Date(sg.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
