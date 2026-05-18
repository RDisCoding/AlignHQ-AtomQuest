"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { useEffect, useState } from "react";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Users } from "lucide-react";

type AnalyticsData = {
  quarterlyTrend: Array<{ quarter: string; completed: number; onTrack: number; notStarted: number; total: number }>;
  statusBreakdown: Array<{ name: string; value: number; color: string }>;
  thrustAreaData: Array<{ name: string; goals: number; avgWeightage: number }>;
  employeeCompletion: Array<{ name: string; rate: number; totalGoals: number; completed: number }>;
  totalGoals: number;
  totalSheets: number;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold" fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const hasData = data.totalGoals > 0;

  return (
    <div className="space-y-8">
      {!hasData ? (
        <div className="text-center py-16 bg-white rounded-xl border shadow-sm">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No analytics data yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Analytics will appear once goals are approved and quarterly check-ins are logged.</p>
        </div>
      ) : (
        <>
          {/* Quarterly Trend */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Quarter-on-Quarter Goal Status</h2>
                <p className="text-sm text-gray-500">Check-in completion breakdown per quarter</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.quarterlyTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                />
                <Legend />
                <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="onTrack" name="On Track" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="notStarted" name="Not Started" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown Pie */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <PieChartIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Q1 Goal Status Distribution</h2>
                  <p className="text-sm text-gray-500">Breakdown across all goals</p>
                </div>
              </div>
              {data.statusBreakdown.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No Q1 check-ins logged yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={data.statusBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={renderCustomLabel}>
                      {data.statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "8px" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Thrust Area Breakdown */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Goals by Thrust Area</h2>
                  <p className="text-sm text-gray-500">Distribution and average weightage</p>
                </div>
              </div>
              {data.thrustAreaData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No thrust area data</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.thrustAreaData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip contentStyle={{ borderRadius: "8px" }} />
                    <Legend />
                    <Bar dataKey="goals" name="# Goals" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="avgWeightage" name="Avg Weight%" fill="#a5b4fc" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Employee Completion Heatmap / Table */}
          {data.employeeCompletion.length > 1 && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Employee Completion Rates — Q1</h2>
                  <p className="text-sm text-gray-500">Who has completed their Q1 check-ins</p>
                </div>
              </div>
              <div className="space-y-3">
                {data.employeeCompletion.map(emp => (
                  <div key={emp.name} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-gray-700 shrink-0 truncate">{emp.name}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
                      <div
                        className={`h-4 rounded-full transition-all duration-700 ${emp.rate >= 80 ? 'bg-green-500' : emp.rate >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                        style={{ width: `${emp.rate}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm font-semibold text-gray-900">{emp.rate}%</div>
                    <div className="text-xs text-gray-400">{emp.completed}/{emp.totalGoals}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
