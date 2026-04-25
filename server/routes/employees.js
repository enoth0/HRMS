import { Router } from "express";
import Employee from "../models/Employee.js";
import { auth } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { semanticSearch } from "../ai/semanticSearch.js";

const router = Router();

/**
 * GET /api/employees
 * Admin/Manager: paginated, searchable, filterable employee list.
 */
router.get(
  "/",
  auth,
  roleGuard(["admin", "senior_manager", "hr_recruiter"]),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        department,
        status,
      } = req.query;

      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { employeeId: { $regex: search, $options: "i" } },
        ];
      }
      if (department) query.department = department;
      if (status) query.status = status;

      const [employees, total] = await Promise.all([
        Employee.find(query)
          .populate("manager", "name employeeId")
          .skip((page - 1) * limit)
          .limit(Number(limit))
          .sort({ createdAt: -1 }),
        Employee.countDocuments(query),
      ]);

      res.json({
        employees,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * GET /api/employees/:id
 * Get single employee. Employees can only access their own record.
 */
router.get("/:id", auth, async (req, res) => {
  try {
    if (
      req.user.role === "employee" &&
      req.user.employeeId?.toString() !== req.params.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
    const employee = await Employee.findById(req.params.id).populate(
      "manager",
      "name employeeId designation"
    );
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/employees
 * Admin/HR: create new employee.
 */
router.post(
  "/",
  auth,
  roleGuard(["admin", "hr_recruiter"]),
  async (req, res) => {
    try {
      const employee = await Employee.create(req.body);
      res.status(201).json(employee);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: "Email already exists" });
      }
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * PUT /api/employees/:id
 * Admin/HR: update employee record.
 */
router.put(
  "/:id",
  auth,
  roleGuard(["admin", "hr_recruiter"]),
  async (req, res) => {
    try {
      const employee = await Employee.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!employee) return res.status(404).json({ message: "Employee not found" });
      res.json(employee);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * DELETE /api/employees/:id
 * Admin only: soft delete (set status = inactive).
 */
router.delete(
  "/:id",
  auth,
  roleGuard(["admin"]),
  async (req, res) => {
    try {
      const employee = await Employee.findByIdAndUpdate(
        req.params.id,
        { status: "inactive" },
        { new: true }
      );
      if (!employee) return res.status(404).json({ message: "Employee not found" });
      res.json({ message: "Employee deactivated", employee });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * POST /api/employees/semantic-search
 * HR/Admin: semantic search using HuggingFace embeddings.
 */
router.post(
  "/semantic-search",
  auth,
  roleGuard(["admin", "hr_recruiter", "senior_manager"]),
  async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) return res.status(400).json({ message: "Query is required" });

      const results = await semanticSearch(query);
      res.json({ results });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
