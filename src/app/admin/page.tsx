"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, FileText, CheckCircle2, Clock, Lock, Unlock, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Stats = {
  totalEmployees: number;
  totalSheets: number;
  lockedSheets: number;
  submittedSheets: number;
  draftSheets: number;
};

type GoalSheet = {
  id: string;
  status: string;
  period: string;
  employee: { user: { name: string; email: string } };
};

type AuditLog = {
  id: string;
  action: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { name: string; email: string };
  goal: { title: string } | null;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sheets, setSheets] = useState<GoalSheet[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "audit">("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, sheetsRes, auditRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/goal-sheets"),
        fetch("/api/admin/audit-logs"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (sheetsRes.ok) setSheets(await sheetsRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (sheetId: string) => {
    try {
      const res = await fetch(`/api/admin/goal-sheets/${sheetId}/unlock`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Goal sheet unlocked successfully.");
        fetchData();
      } else {
        toast.error("Failed to unlock.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage cycles, oversee completion rates, and govern exceptions.</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Employees", value: stats.totalEmployees, icon: <Users className="h-5 w-5 text-blue-500" />, color: "bg-blue-50 border-blue-200" },
            { label: "Goal Sheets", value: stats.totalSheets, icon: <FileText className="h-5 w-5 text-gray-500" />, color: "bg-gray-50 border-gray-200" },
            { label: "Approved & Locked", value: stats.lockedSheets, icon: <Lock className="h-5 w-5 text-green-500" />, color: "bg-green-50 border-green-200" },
            { label: "Pending Approval", value: stats.submittedSheets, icon: <Clock className="h-5 w-5 text-amber-500" />, color: "bg-amber-50 border-amber-200" },
            { label: "Still in Draft", value: stats.draftSheets, icon: <CheckCircle2 className="h-5 w-5 text-gray-400" />, color: "bg-gray-50 border-gray-200" },
          ].map(s => (
            <div key={s.label} className={`p-4 rounded-xl border ${s.color}`}>
              <div className="flex justify-between items-start mb-2">{s.icon}</div>
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["overview", "audit"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {tab === "audit" ? "Audit Logs" : "Goal Sheets"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : activeTab === "overview" ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Employee</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Period</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sheets.map(sheet => (
                <tr key={sheet.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{sheet.employee?.user?.name}</div>
                    <div className="text-xs text-gray-400">{sheet.employee?.user?.email}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{sheet.period}</td>
                  <td className="px-5 py-4">
                    {sheet.status === "LOCKED" && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Locked</span>}
                    {sheet.status === "SUBMITTED" && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">Pending</span>}
                    {sheet.status === "DRAFT" && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">Draft</span>}
                  </td>
                  <td className="px-5 py-4">
                    {sheet.status === "LOCKED" && (
                      <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => handleUnlock(sheet.id)}>
                        <Unlock className="h-3.5 w-3.5 mr-1.5" /> Unlock
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-5 border-b flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Audit Trail</h2>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No audit events recorded yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Timestamp</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Actor</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Action</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Goal</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-900">{log.user?.name || log.user?.email}</td>
                    <td className="px-5 py-3"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{log.action}</span></td>
                    <td className="px-5 py-3 text-gray-600">{log.goal?.title || "—"}</td>
                    <td className="px-5 py-3">
                      {log.previousValue && <span className="text-red-500 line-through mr-2">{log.previousValue}</span>}
                      {log.newValue && <span className="text-green-600">{log.newValue}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
