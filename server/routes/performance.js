import { Router } from "express";
import Performance from "../models/Performance.js";
import Employee from "../models/Employee.js";
import { auth } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { generatePerformanceSummary } from "../ai/performanceAnalyzer.js";

const router = Router();

/**
 * POST /api/performance
 * Manager/Admin: create a performance review with goals.
 */
router.post(
  "/",
  auth,
  roleGuard(["admin", "senior_manager", "hr_recruiter"]),
  async (req, res) => {
    try {
      const { employee, reviewPeriod, goals } = req.body;
      const review = await Performance.create({
        employee,
        reviewPeriod,
        goals,
        reviewedBy: req.user.employeeId,
      });
      res.status(201).json(review);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * PUT /api/performance/:id/submit
 * Manager: submit review. Triggers Gemini AI summary generation.
 */
router.put(
  "/:id/submit",
  auth,
  roleGuard(["admin", "senior_manager"]),
  async (req, res) => {
    try {
      const review = await Performance.findById(req.params.id).populate(
        "employee",
        "name designation department"
      );
      if (!review) return res.status(404).json({ message: "Review not found" });

      // Calculate overall score from goal scores
      const overallScore =
        review.goals.length > 0
          ? Math.round(
              (review.goals.reduce((sum, g) => sum + (g.score || 0), 0) /
                (review.goals.length * 10)) *
                100
            )
          : 0;

      // Generate AI summary
      let aiSummary = null;
      try {
        aiSummary = await generatePerformanceSummary(
          review.employee,
          review.goals,
          overallScore
        );
      } catch (aiErr) {
        console.error("AI summary failed:", aiErr.message);
        aiSummary = { executiveSummary: "AI summary unavailable at this time." };
      }

      review.overallScore = overallScore;
      review.aiSummary = aiSummary;
      review.status = "submitted";
      await review.save();

      res.json({ message: "Review submitted with AI analysis", review });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * GET /api/performance/my
 * Employee: own performance reviews.
 */
router.get("/my", auth, async (req, res) => {
  try {
    const reviews = await Performance.find({ employee: req.user.employeeId })
      .populate("reviewedBy", "name designation")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/performance/:employeeId
 * Admin/Manager: view any employee's performance reviews.
 */
router.get(
  "/:employeeId",
  auth,
  roleGuard(["admin", "senior_manager"]),
  async (req, res) => {
    try {
      const reviews = await Performance.find({
        employee: req.params.employeeId,
      })
        .populate("reviewedBy", "name designation")
        .sort({ createdAt: -1 });
      res.json(reviews);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
