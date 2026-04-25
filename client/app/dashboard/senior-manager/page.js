"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/shared/DashboardLayout.js";
import StatCard from "../../../components/ui/StatCard.js";
import { get, post } from "../../../lib/api.js";

export default function SeniorManagerDashboard() {
  const [employees, setEmployees] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await get("/api/employees?limit=10");
        setEmployees(data.employees || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function fetchAiInsight() {
    setInsightLoading(true);
    try {
      const sessionId = "manager-insight-" + Date.now();
      const data = await post("/api/ai/chat", {
        message: "Give me a brief weekly HR insight summary for a senior manager: team morale, productivity tips, and one action item.",
        sessionId,
        context: { role: "senior_manager" },
      });
      setAiInsight(data.reply);
    } catch (e) {
      setAiInsight("Unable to fetch AI insights at this time. Please try again.");
    } finally {
      setInsightLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manager Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Team overview and insights</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Team Size" value={employees.length} icon="👥" color="blue" />
          <StatCard title="Avg. Performance Score" value="78/100" icon="📊" color="green" />
          <StatCard title="Attendance Rate" value="94%" icon="📅" color="purple" />
        </div>

        {/* AI Weekly Insight */}
        <div className="card border-l-4 border-blue-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">🤖 AI Weekly Team Insight</h3>
              {aiInsight ? (
                <p className="text-sm text-gray-700 leading-relaxed">{aiInsight}</p>
              ) : (
                <p className="text-sm text-gray-400">Click "Generate" to get an AI-powered team summary.</p>
              )}
            </div>
            <button
              onClick={fetchAiInsight}
              disabled={insightLoading}
              className="btn-primary shrink-0 text-sm"
            >
              {insightLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Team Table */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Team Members</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Name", "Department", "Designation", "Status", "Score"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&size=28&background=6366f1&color=fff`}
                            className="w-7 h-7 rounded-full" alt={emp.name}
                          />
                          <span className="font-medium text-gray-900">{emp.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{emp.department}</td>
                      <td className="py-3 px-3 text-gray-600">{emp.designation}</td>
                      <td className="py-3 px-3">
                        <span className={`badge ${emp.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="badge bg-blue-100 text-blue-700">—</span>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No team members found</td></tr>
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
