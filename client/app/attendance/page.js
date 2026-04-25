"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout.js";
import ChatWidget from "../../components/ai/ChatWidget.js";
import { get, post } from "../../lib/api.js";
import { getUser } from "../../lib/auth.js";

const STATUS_COLORS = {
  present: "bg-green-500",
  absent: "bg-red-400",
  "half-day": "bg-yellow-400",
  wfh: "bg-blue-400",
};

const STATUS_BG = {
  present: "bg-green-50 border-green-200 text-green-700",
  absent: "bg-red-50 border-red-200 text-red-700",
  "half-day": "bg-yellow-50 border-yellow-200 text-yellow-700",
  wfh: "bg-blue-50 border-blue-200 text-blue-700",
};

export default function AttendancePage() {
  const user = getUser();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [month] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    async function load() {
      try {
        const data = await get("/api/attendance/my?limit=31");
        setRecords(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function checkIn() {
    setActionLoading(true);
    try {
      await post("/api/attendance/checkin", {});
      const data = await get("/api/attendance/my?limit=31");
      setRecords(data || []);
      alert("✅ Checked in!");
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Build calendar grid
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const recordMap = {};
  records.forEach(r => {
    const key = new Date(r.date).getDate();
    recordMap[key] = r;
  });

  const totalPresent = records.filter(r => r.status === "present").length;
  const totalWfh = records.filter(r => r.status === "wfh").length;
  const totalAbsent = records.filter(r => r.status === "absent").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Attendance</h2>
            <p className="text-gray-500 text-sm mt-1">
              {new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}
            </p>
          </div>
          {user?.role === "employee" && (
            <button onClick={checkIn} disabled={actionLoading} className="btn-primary">
              {actionLoading ? "Processing..." : "📍 Check In Now"}
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Present", value: totalPresent, color: "green" },
            { label: "WFH", value: totalWfh, color: "blue" },
            { label: "Absent", value: totalAbsent, color: "red" },
          ].map(s => (
            <div key={s.label} className={`card text-center border-t-4 border-${s.color}-400`}>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Calendar</h3>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-1 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const rec = recordMap[day];
              const isToday = day === new Date().getDate() && month === new Date().getMonth() + 1;
              return (
                <div
                  key={day}
                  title={rec ? `${rec.status}${rec.hoursWorked ? ` • ${rec.hoursWorked}h` : ""}` : ""}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium cursor-default border
                    ${rec ? STATUS_BG[rec.status] || "bg-gray-50 text-gray-600 border-gray-100"
                          : "bg-gray-50 text-gray-400 border-gray-100"}
                    ${isToday ? "ring-2 ring-blue-500" : ""}`}
                >
                  <span>{day}</span>
                  {rec && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${STATUS_COLORS[rec.status] || "bg-gray-400"}`} />}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="capitalize">{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Records Table */}
        <div className="card overflow-x-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Detailed Records</h3>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Date", "Check In", "Check Out", "Hours", "Status"].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(rec => (
                  <tr key={rec._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-700">{new Date(rec.date).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-gray-600">
                      {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="py-3 px-3 text-gray-600">{rec.hoursWorked ? `${rec.hoursWorked}h` : "—"}</td>
                    <td className="py-3 px-3">
                      <span className={`badge capitalize border ${STATUS_BG[rec.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No records this month</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <ChatWidget />
    </DashboardLayout>
  );
}
