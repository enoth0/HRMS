import { Router } from "express";
import Payroll from "../models/Payroll.js";
import Employee from "../models/Employee.js";
import { auth } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";

const router = Router();

/**
 * POST /api/payroll/generate
 * HR: generate payroll for all active employees for a given month/year.
 */
router.post(
  "/generate",
  auth,
  roleGuard(["admin", "hr_recruiter"]),
  async (req, res) => {
    try {
      const { month, year, allowancesPercent = 20, deductionsPercent = 10 } = req.body;
      if (!month || !year) {
        return res.status(400).json({ message: "month and year are required" });
      }

      const employees = await Employee.find({ status: "active" });
      const results = [];

      for (const emp of employees) {
        const existing = await Payroll.findOne({ employee: emp._id, month, year });
        if (existing) {
          results.push({ employeeId: emp.employeeId, status: "skipped (already exists)" });
          continue;
        }

        const basicSalary = emp.salary;
        const allowances = Math.round(basicSalary * (allowancesPercent / 100));
        const deductions = Math.round(basicSalary * (deductionsPercent / 100));
        const netSalary = basicSalary + allowances - deductions;

        const slip = await Payroll.create({
          employee: emp._id,
          month,
          year,
          basicSalary,
          allowances,
          deductions,
          netSalary,
          status: "processed",
        });
        results.push({ employeeId: emp.employeeId, netSalary, slipId: slip._id });
      }

      res.status(201).json({ message: "Payroll generated", results });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * GET /api/payroll/:employeeId/slips
 * Employee: own payslips. Admin/HR: any employee's slips.
 */
router.get("/:employeeId/slips", auth, async (req, res) => {
  try {
    if (
      req.user.role === "employee" &&
      req.user.employeeId?.toString() !== req.params.employeeId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { page = 1, limit = 12 } = req.query;
    const slips = await Payroll.find({ employee: req.params.employeeId })
      .sort({ year: -1, month: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("employee", "name employeeId department designation");

    res.json(slips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/payroll/:id/process
 * Admin: mark payroll as paid.
 */
router.put("/:id/process", auth, roleGuard(["admin"]), async (req, res) => {
  try {
    const slip = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status: "paid", processedAt: new Date() },
      { new: true }
    );
    if (!slip) return res.status(404).json({ message: "Payroll record not found" });
    res.json({ message: "Marked as paid", slip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
