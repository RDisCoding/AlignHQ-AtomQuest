"use client";

import { useEffect, useState } from "react";
import { FileDown, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type ReportRow = {
  employeeName: string;
  employeeEmail: string;
  period: string;
  goalTitle: string;
  thrustArea: string;
  uomType: string;
  target: number;
  weightage: number;
  q1Actual: number | null;
  q1Status: string | null;
  q2Actual: number | null;
  q2Status: string | null;
  q3Actual: number | null;
  q3Status: string | null;
  q4Actual: number | null;
  q4Status: string | null;
};

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [filtered, setFiltered] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ status: "ALL", quarter: "ALL" });

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          const data = await res.json();
          setRows(data);
          setFiltered(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch_();
  }, []);

  useEffect(() => {
    let data = [...rows];
    if (filters.status !== "ALL") {
      data = data.filter(r => {
        const statuses = [r.q1Status, r.q2Status, r.q3Status, r.q4Status];
        return statuses.some(s => s === filters.status);
      });
    }
    setFiltered(data);
  }, [filters, rows]);

  const exportCSV = () => {
    const headers = ["Employee", "Email", "Period", "Goal", "Thrust Area", "UoM", "Target", "Weight%", "Q1 Actual", "Q1 Status", "Q2 Actual", "Q2 Status", "Q3 Actual", "Q3 Status", "Q4 Actual", "Q4 Status"];
    const csvRows = filtered.map(r => [
      r.employeeName, r.employeeEmail, r.period, r.goalTitle, r.thrustArea, r.uomType,
      r.target, r.weightage,
      r.q1Actual ?? "", r.q1Status ?? "",
      r.q2Actual ?? "", r.q2Status ?? "",
      r.q3Actual ?? "", r.q3Status ?? "",
      r.q4Actual ?? "", r.q4Status ?? "",
    ].join(","));

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `achievement-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Achievement Reports</h1>
          <p className="text-gray-500 mt-1">View and export planned vs. actual performance data</p>
        </div>
        <Button onClick={exportCSV} className="bg-green-600 hover:bg-green-700">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 flex gap-6 items-end shadow-sm">
        <Filter className="h-5 w-5 text-gray-400 mb-2.5" />
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Status</Label>
          <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v || "ALL" }))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ON_TRACK">On Track</SelectItem>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-500 mb-2.5">
          Showing <span className="font-semibold text-gray-900">{filtered.length}</span> of {rows.length} records
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 border-b text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Employee</th>
                <th className="text-left px-4 py-3">Goal</th>
                <th className="text-left px-4 py-3">Thrust Area</th>
                <th className="text-center px-4 py-3">Target</th>
                <th className="text-center px-4 py-3">Weight</th>
                <th className="text-center px-4 py-3 bg-blue-50">Q1 Actual</th>
                <th className="text-center px-4 py-3 bg-green-50">Q2 Actual</th>
                <th className="text-center px-4 py-3 bg-amber-50">Q3 Actual</th>
                <th className="text-center px-4 py-3 bg-purple-50">Q4 Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No data to display. Goals must be approved & check-ins logged.</td></tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{row.employeeName}</div>
                    <div className="text-xs text-gray-400">{row.period}</div>
                  </td>
                  <td className="px-4 py-3 max-w-48">
                    <span className="font-medium text-gray-800 line-clamp-1">{row.goalTitle}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{row.thrustArea}</td>
                  <td className="px-4 py-3 text-center font-medium">{row.target}</td>
                  <td className="px-4 py-3 text-center">{row.weightage}%</td>
                  {(["q1","q2","q3","q4"] as const).map(q => {
                    const actual = row[`${q}Actual` as keyof ReportRow] as number | null;
                    const status = row[`${q}Status` as keyof ReportRow] as string | null;
                    return (
                      <td key={q} className="px-4 py-3 text-center">
                        {actual != null ? (
                          <div>
                            <span className="font-semibold text-gray-900">{actual}</span>
                            {status && (
                              <div className={`text-xs mt-0.5 ${status === "COMPLETED" ? "text-green-600" : status === "ON_TRACK" ? "text-amber-600" : "text-gray-400"}`}>
                                {status.replace("_", " ")}
                              </div>
                            )}
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
