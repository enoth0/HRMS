"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/shared/DashboardLayout.js";
import StatCard from "../../../components/ui/StatCard.js";
import { get } from "../../../lib/api.js";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const DEPT_DATA = [
  { dept: "Engineering", count: 42 },
  { dept: "HR", count: 12 },
  { dept: "Sales", count: 28 },
  { dept: "Finance", count: 15 },
  { dept: "Marketing", count: 18 },
];

const HIRING_DATA = [
  { month: "Jan", hired: 4 }, { month: "Feb", hired: 7 }, { month: "Mar", hired: 3 },
  { month: "Apr", hired: 9 }, { month: "May", hired: 6 }, { month: "Jun", hired: 11 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, payrollPending: 0, openPositions: 0 });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await get("/api/employees?limit=5&page=1");
        setRecentEmployees(data.employees || []);
        setStats((s) => ({ ...s, total: data.pagination?.total || 0 }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Overview of your organization</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Employees" value={stats.total} icon="👥" color="blue" change="+3" />
          <StatCard title="Active This Month" value={stats.active || stats.total} icon="✅" color="green" />
          <StatCard title="Payroll Pending" value="12" icon="💰" color="yellow" />
          <StatCard title="Open Positions" value="8" icon="🎯" color="purple" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Department Headcount</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={DEPT_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Hiring Trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={HIRING_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="hired" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Employees */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Employee Additions</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Employee</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Department</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Designation</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEmployees.map((emp) => (
                    <tr key={emp._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&size=28&background=3b82f6&color=fff`}
                            className="w-7 h-7 rounded-full"
                            alt={emp.name}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{emp.name}</p>
                            <p className="text-xs text-gray-400">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{emp.department}</td>
                      <td className="py-3 px-3 text-gray-600">{emp.designation}</td>
                      <td className="py-3 px-3">
                        <span className={`badge ${emp.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                  {recentEmployees.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No employees yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
