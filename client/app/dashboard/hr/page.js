"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/shared/DashboardLayout.js";
import StatCard from "../../../components/ui/StatCard.js";
import { get, post } from "../../../lib/api.js";

function ScoreBadge({ score }) {
  if (score === null || score === undefined) return <span className="badge bg-gray-100 text-gray-500">Not screened</span>;
  const color = score >= 75 ? "bg-green-100 text-green-700" : score >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`badge ${color}`}>{score}/100</span>;
}

function RecommendationChip({ rec }) {
  if (!rec) return null;
  const map = { shortlist: "bg-green-100 text-green-700", reject: "bg-red-100 text-red-700", hold: "bg-yellow-100 text-yellow-700" };
  return <span className={`badge ${map[rec] || "bg-gray-100 text-gray-500"}`}>{rec}</span>;
}

export default function HRDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screening, setScreening] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await get("/api/recruitment/applications?limit=10");
        setApplications(data.applications || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function runScreening(id) {
    setScreening(id);
    try {
      await post(`/api/recruitment/screen/${id}`, { jobDescription: "" });
      const data = await get("/api/recruitment/applications?limit=10");
      setApplications(data.applications || []);
    } catch (e) {
      alert("Screening failed: " + e.message);
    } finally {
      setScreening(null);
    }
  }

  const today = applications.filter(a => new Date(a.appliedAt).toDateString() === new Date().toDateString()).length;
  const shortlisted = applications.filter(a => a.status === "shortlisted").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HR Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Recruitment pipeline overview</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Applications Today" value={today} icon="📨" color="blue" />
          <StatCard title="Shortlisted" value={shortlisted} icon="✅" color="green" />
          <StatCard title="Interviews Scheduled" value="5" icon="📅" color="purple" />
          <StatCard title="Open Positions" value="8" icon="🎯" color="yellow" />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Applications</h3>
            <a href="/recruitment" className="text-sm text-blue-600 hover:underline">View all →</a>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading applications...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Applicant", "Position", "Applied", "AI Score", "Recommendation", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <p className="font-medium text-gray-900">{app.applicantName}</p>
                        <p className="text-xs text-gray-400">{app.email}</p>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{app.position}</td>
                      <td className="py-3 px-3 text-gray-500">{new Date(app.appliedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3"><ScoreBadge score={app.aiScore} /></td>
                      <td className="py-3 px-3"><RecommendationChip rec={app.recommendation} /></td>
                      <td className="py-3 px-3">
                        <span className="badge bg-gray-100 text-gray-700 capitalize">{app.status}</span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => runScreening(app._id)}
                          disabled={screening === app._id}
                          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                        >
                          {screening === app._id ? "Screening..." : "Run AI Screen"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No applications yet</td></tr>
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
