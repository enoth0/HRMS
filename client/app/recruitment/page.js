"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout.js";
import ChatWidget from "../../components/ai/ChatWidget.js";
import { get, post, put } from "../../lib/api.js";

function ScoreBadge({ score }) {
  if (score === null || score === undefined) return <span className="badge bg-gray-100 text-gray-500">—</span>;
  const color = score >= 75 ? "bg-green-100 text-green-700" : score >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`badge font-bold ${color}`}>{score}</span>;
}

function RecommendationChip({ rec }) {
  if (!rec) return <span className="text-gray-300">—</span>;
  const map = { shortlist: "bg-green-100 text-green-700", reject: "bg-red-100 text-red-700", hold: "bg-yellow-100 text-yellow-700" };
  return <span className={`badge capitalize ${map[rec] || "bg-gray-100 text-gray-500"}`}>{rec}</span>;
}

export default function RecruitmentPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screening, setScreening] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ status: "", position: "", minScore: "", maxScore: "" });
  const [jobDesc, setJobDesc] = useState("");

  async function loadApplications() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (filters.status) params.set("status", filters.status);
      if (filters.position) params.set("position", filters.position);
      if (filters.minScore) params.set("minScore", filters.minScore);
      if (filters.maxScore) params.set("maxScore", filters.maxScore);
      const data = await get(`/api/recruitment/applications?${params}`);
      setApplications(data.applications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadApplications(); }, []);

  async function runScreening(id) {
    setScreening(id);
    try {
      await post(`/api/recruitment/screen/${id}`, { jobDescription: jobDesc || `Relevant position` });
      await loadApplications();
    } catch (e) {
      alert("Screening failed: " + e.message);
    } finally {
      setScreening(null);
    }
  }

  async function updateStatus(id, status) {
    try {
      await put(`/api/recruitment/${id}/status`, { status });
      await loadApplications();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recruitment</h2>
            <p className="text-gray-500 text-sm mt-1">{applications.length} applications</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select className="input" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              {["pending", "shortlisted", "rejected", "hired"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="input" placeholder="Filter by position..." value={filters.position}
              onChange={e => setFilters(f => ({ ...f, position: e.target.value }))} />
            <input className="input" type="number" placeholder="Min AI score" value={filters.minScore}
              onChange={e => setFilters(f => ({ ...f, minScore: e.target.value }))} />
            <input className="input" type="number" placeholder="Max AI score" value={filters.maxScore}
              onChange={e => setFilters(f => ({ ...f, maxScore: e.target.value }))} />
            <button onClick={loadApplications} className="btn-primary">Apply Filters</button>
          </div>
          <div className="mt-3">
            <input className="input" placeholder="Job description for AI screening (optional)..."
              value={jobDesc} onChange={e => setJobDesc(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Applicant", "Position", "Applied", "AI Score", "Recommendation", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : applications.map(app => (
                <tr key={app._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <button onClick={() => setSelected(app)} className="text-left">
                      <p className="font-medium text-blue-600 hover:underline">{app.applicantName}</p>
                      <p className="text-xs text-gray-400">{app.email}</p>
                    </button>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{app.position}</td>
                  <td className="py-3 px-3 text-gray-500">{new Date(app.appliedAt).toLocaleDateString()}</td>
                  <td className="py-3 px-3"><ScoreBadge score={app.aiScore} /></td>
                  <td className="py-3 px-3"><RecommendationChip rec={app.recommendation} /></td>
                  <td className="py-3 px-3">
                    <select
                      value={app.status}
                      onChange={e => updateStatus(app._id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1"
                    >
                      {["pending", "shortlisted", "rejected", "hired"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => runScreening(app._id)}
                      disabled={screening === app._id}
                      className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {screening === app._id ? "⏳ Screening..." : "🤖 Run AI Screen"}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && applications.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No applications found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Application Detail</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-gray-500">Name</p><p className="font-medium">{selected.applicantName}</p></div>
                <div><p className="text-gray-500">Email</p><p className="font-medium">{selected.email}</p></div>
                <div><p className="text-gray-500">Position</p><p className="font-medium">{selected.position}</p></div>
                <div><p className="text-gray-500">AI Score</p><ScoreBadge score={selected.aiScore} /></div>
              </div>
              {selected.aiSummary && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">AI Summary</p>
                  <p className="text-gray-700 bg-blue-50 rounded-lg p-3">{selected.aiSummary}</p>
                </div>
              )}
              {selected.aiReasoning && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Reasoning</p>
                  <p className="text-gray-700">{selected.aiReasoning}</p>
                </div>
              )}
              {selected.skillsMatched?.length > 0 && (
                <div>
                  <p className="text-gray-500 font-medium mb-2">Skills Matched</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.skillsMatched.map(s => <span key={s} className="badge bg-green-100 text-green-700">{s}</span>)}
                  </div>
                </div>
              )}
              {selected.skillsMissing?.length > 0 && (
                <div>
                  <p className="text-gray-500 font-medium mb-2">Skills Missing</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.skillsMissing.map(s => <span key={s} className="badge bg-red-100 text-red-700">{s}</span>)}
                  </div>
                </div>
              )}
              {selected.resumeText && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Resume Text</p>
                  <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{selected.resumeText.slice(0, 600)}...</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ChatWidget />
    </DashboardLayout>
  );
}
