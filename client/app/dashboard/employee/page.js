"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/shared/DashboardLayout.js";
import StatCard from "../../../components/ui/StatCard.js";
import { get, post } from "../../../lib/api.js";
import { getUser } from "../../../lib/auth.js";

export default function EmployeeDashboard() {
  const user = getUser();
  const [attendance, setAttendance] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [attData, payData] = await Promise.allSettled([
          get("/api/attendance/my?limit=5"),
          get(`/api/payroll/${user?.employeeId}/slips?limit=3`),
        ]);
        if (attData.status === "fulfilled") {
          setAttendance(attData.value || []);
          const today = new Date().toDateString();
          const todayRecord = attData.value?.find(r => new Date(r.date).toDateString() === today);
          setCheckedIn(!!todayRecord?.checkIn);
        }
        if (payData.status === "fulfilled") setPayslips(payData.value || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCheckIn() {
    setActionLoading(true);
    try {
      await post("/api/attendance/checkin", {});
      setCheckedIn(true);
      alert("✅ Checked in successfully!");
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/attendance/checkout`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      alert("✅ Checked out successfully!");
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  const latestSlip = payslips[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(" ")[0]} 👋</h2>
          <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Today's Status" value={checkedIn ? "Checked In ✅" : "Not Checked In"} icon="📍" color={checkedIn ? "green" : "yellow"} />
          <StatCard title="Leave Balance" value="12 days" icon="🌴" color="blue" />
          <StatCard title="Latest Net Salary" value={latestSlip ? `₹${latestSlip.netSalary?.toLocaleString()}` : "—"} icon="💰" color="green" />
          <StatCard title="Performance Score" value="82/100" icon="📊" color="purple" />
        </div>

        {/* Attendance Actions */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Attendance</h3>
          <div className="flex gap-3">
            <button
              onClick={handleCheckIn}
              disabled={checkedIn || actionLoading}
              className="btn-primary"
            >
              {actionLoading ? "Processing..." : "Check In"}
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!checkedIn || actionLoading}
              className="btn-secondary"
            >
              Check Out
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Attendance</h3>
            {loading ? (
              <div className="text-gray-400 text-sm">Loading...</div>
            ) : (
              <div className="space-y-2">
                {attendance.slice(0, 5).map(rec => (
                  <div key={rec._id} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-600">{new Date(rec.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {rec.checkIn && <span>In: {new Date(rec.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                      {rec.checkOut && <span>Out: {new Date(rec.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                      <span className={`badge ${rec.status === "present" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{rec.status}</span>
                    </div>
                  </div>
                ))}
                {attendance.length === 0 && <p className="text-gray-400 text-sm">No attendance records</p>}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Payslips</h3>
            {loading ? (
              <div className="text-gray-400 text-sm">Loading...</div>
            ) : (
              <div className="space-y-3">
                {payslips.map(slip => (
                  <div key={slip._id} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(0, slip.month - 1).toLocaleString("default", { month: "long" })} {slip.year}
                      </p>
                      <p className="text-xs text-gray-400">Net: ₹{slip.netSalary?.toLocaleString()}</p>
                    </div>
                    <span className={`badge ${slip.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {slip.status}
                    </span>
                  </div>
                ))}
                {payslips.length === 0 && <p className="text-gray-400 text-sm">No payslips yet</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
