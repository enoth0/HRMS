"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout.js";
import ChatWidget from "../../components/ai/ChatWidget.js";
import { get, post, put } from "../../lib/api.js";
import { getUser } from "../../lib/auth.js";

const RATING_COLORS = {
  "Exceptional": "bg-green-100 text-green-700",
  "Exceeds Expectations": "bg-blue-100 text-blue-700",
  "Meets Expectations": "bg-yellow-100 text-yellow-700",
  "Needs Improvement": "bg-red-100 text-red-700",
};

function GoalProgressBar({ goal }) {
  const pct = goal.target && goal.achieved
    ? Math.min(100, Math.round((parseFloat(goal.achieved) / parseFloat(goal.target)) * 100))
    : (goal.score * 10) || 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 font-medium">{goal.title}</span>
        <span className="text-gray-500">{goal.score}/10</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-yellow-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {goal.target && <p className="text-xs text-gray-400">Target: {goal.target} • Achieved: {goal.achieved || "—"}</p>}
    </div>
  );
}

export default function PerformancePage() {
  const user = getUser();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(null);
  const [newReview, setNewReview] = useState({
    employee: "",
    reviewPeriod: "",
    goals: [{ title: "", target: "", achieved: "", score: 5 }],
  });

  const isManager = user?.role === "admin" || user?.role === "senior_manager";

  useEffect(() => {
    async function load() {
      try {
        const data = await get("/api/performance/my");
        setReviews(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function addGoal() {
    setNewReview(r => ({ ...r, goals: [...r.goals, { title: "", target: "", achieved: "", score: 5 }] }));
  }

  function updateGoal(i, field, value) {
    setNewReview(r => {
      const goals = [...r.goals];
      goals[i] = { ...goals[i], [field]: value };
      return { ...r, goals };
    });
  }

  async function createReview() {
    try {
      const data = await post("/api/performance", newReview);
      setReviews(r => [data, ...r]);
      setCreating(false);
      setNewReview({ employee: "", reviewPeriod: "", goals: [{ title: "", target: "", achieved: "", score: 5 }] });
    } catch (e) {
      alert(e.message);
    }
  }

  async function submitReview(id) {
    setSubmitting(id);
    try {
      const data = await put(`/api/performance/${id}/submit`, {});
      setReviews(r => r.map(rev => rev._id === id ? data.review : rev));
      alert("✅ Review submitted with AI analysis!");
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance</h2>
            <p className="text-gray-500 text-sm mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
          </div>
          {isManager && (
            <button onClick={() => setCreating(true)} className="btn-primary">
              + New Review
            </button>
          )}
        </div>

        {/* Reviews */}
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review._id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{review.reviewPeriod}</h3>
                    <p className="text-sm text-gray-500">
                      Reviewed by: {review.reviewedBy?.name || "—"} •{" "}
                      <span className={`badge ${review.status === "submitted" ? "bg-blue-100 text-blue-700" : review.status === "reviewed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {review.status}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{review.overallScore ?? "—"}<span className="text-sm text-gray-400">/100</span></p>
                    {review.aiSummary?.rating && (
                      <span className={`badge text-xs ${RATING_COLORS[review.aiSummary.rating] || "bg-gray-100 text-gray-600"}`}>
                        {review.aiSummary.rating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Goal progress bars */}
                {review.goals?.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {review.goals.map((goal, i) => <GoalProgressBar key={i} goal={goal} />)}
                  </div>
                )}

                {/* AI Summary */}
                {review.aiSummary?.executiveSummary && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
                    <p className="text-xs text-blue-500 font-semibold mb-2">🤖 AI Analysis</p>
                    <p className="text-sm text-gray-700 mb-3">{review.aiSummary.executiveSummary}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {review.aiSummary.strengths?.length > 0 && (
                        <div>
                          <p className="font-semibold text-green-700 mb-1">Strengths</p>
                          <ul className="space-y-0.5 text-gray-600">{review.aiSummary.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                        </div>
                      )}
                      {review.aiSummary.areasForImprovement?.length > 0 && (
                        <div>
                          <p className="font-semibold text-yellow-700 mb-1">Areas to Improve</p>
                          <ul className="space-y-0.5 text-gray-600">{review.aiSummary.areasForImprovement.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                        </div>
                      )}
                      {review.aiSummary.developmentRecommendations?.length > 0 && (
                        <div>
                          <p className="font-semibold text-blue-700 mb-1">Recommendations</p>
                          <ul className="space-y-0.5 text-gray-600">{review.aiSummary.developmentRecommendations.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isManager && review.status === "draft" && (
                  <button
                    onClick={() => submitReview(review._id)}
                    disabled={submitting === review._id}
                    className="btn-primary mt-4 text-sm"
                  >
                    {submitting === review._id ? "⏳ Generating AI Summary..." : "🤖 Submit & Generate AI Analysis"}
                  </button>
                )}
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="card text-center py-10 text-gray-400">No performance reviews yet</div>
            )}
          </div>
        )}
      </div>

      {/* Create Review Modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">New Performance Review</h3>
              <button onClick={() => setCreating(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input className="input" placeholder="MongoDB ObjectId or employee ID" value={newReview.employee}
                  onChange={e => setNewReview(r => ({ ...r, employee: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Period</label>
                <input className="input" placeholder="e.g. Q1 2025" value={newReview.reviewPeriod}
                  onChange={e => setNewReview(r => ({ ...r, reviewPeriod: e.target.value }))} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Goals</label>
                  <button onClick={addGoal} className="text-xs text-blue-600 hover:underline">+ Add Goal</button>
                </div>
                {newReview.goals.map((goal, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 mb-2">
                    <input className="input text-sm" placeholder="Goal title" value={goal.title}
                      onChange={e => updateGoal(i, "title", e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input text-sm" placeholder="Target" value={goal.target}
                        onChange={e => updateGoal(i, "target", e.target.value)} />
                      <input className="input text-sm" placeholder="Achieved" value={goal.achieved}
                        onChange={e => updateGoal(i, "achieved", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Score: {goal.score}/10</label>
                      <input type="range" min={0} max={10} value={goal.score}
                        onChange={e => updateGoal(i, "score", Number(e.target.value))}
                        className="w-full accent-blue-600" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={createReview} className="btn-primary flex-1">Create Review</button>
                <button onClick={() => setCreating(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ChatWidget />
    </DashboardLayout>
  );
}
