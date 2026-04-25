import { Router } from "express";
import Attendance from "../models/Attendance.js";
import { auth } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";

const router = Router();

/**
 * POST /api/attendance/checkin
 * Employee: log check-in with timestamp and IP location.
 */
router.post("/checkin", auth, async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) return res.status(400).json({ message: "No employee profile linked" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      employee: employeeId,
      date: today,
    });
    if (existing?.checkIn) {
      return res.status(409).json({ message: "Already checked in today" });
    }

    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const record = await Attendance.findOneAndUpdate(
      { employee: employeeId, date: today },
      { $set: { checkIn: new Date(), status: "present", location: ip } },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: "Checked in successfully", record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/attendance/checkout
 * Employee: log check-out and auto-compute hoursWorked.
 */
router.put("/checkout", auth, async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({ employee: employeeId, date: today });
    if (!record?.checkIn) {
      return res.status(400).json({ message: "No check-in found for today" });
    }
    if (record.checkOut) {
      return res.status(409).json({ message: "Already checked out today" });
    }

    const checkOut = new Date();
    const hoursWorked =
      (checkOut - record.checkIn) / (1000 * 60 * 60);

    record.checkOut = checkOut;
    record.hoursWorked = Math.round(hoursWorked * 100) / 100;
    if (hoursWorked < 4) record.status = "half-day";
    await record.save();

    res.json({ message: "Checked out successfully", record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/attendance/report/:employeeId
 * HR/Admin: monthly attendance report for an employee.
 */
router.get(
  "/report/:employeeId",
  auth,
  roleGuard(["admin", "hr_recruiter", "senior_manager"]),
  async (req, res) => {
    try {
      const { month, year } = req.query;
      const m = parseInt(month) || new Date().getMonth() + 1;
      const y = parseInt(year) || new Date().getFullYear();

      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);

      const records = await Attendance.find({
        employee: req.params.employeeId,
        date: { $gte: start, $lte: end },
      }).sort({ date: 1 });

      const summary = {
        present: records.filter((r) => r.status === "present").length,
        absent: records.filter((r) => r.status === "absent").length,
        halfDay: records.filter((r) => r.status === "half-day").length,
        wfh: records.filter((r) => r.status === "wfh").length,
        totalHours: records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0),
      };

      res.json({ records, summary, month: m, year: y });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * GET /api/attendance/my
 * Employee: own attendance history (last 30 days by default).
 */
router.get("/my", auth, async (req, res) => {
  try {
    const { page = 1, limit = 31 } = req.query;
    const records = await Attendance.find({ employee: req.user.employeeId })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
