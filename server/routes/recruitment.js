import { Router } from "express";
import JobApplication from "../models/JobApplication.js";
import { auth } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { screenResume } from "../ai/resumeScreener.js";

const router = Router();

/**
 * POST /api/recruitment/apply
 * Public: submit a job application with resume text.
 */
router.post("/apply", async (req, res) => {
  try {
    const { applicantName, email, phone, position, resumeText, resumeUrl } =
      req.body;
    if (!applicantName || !email || !position) {
      return res.status(400).json({ message: "Name, email, and position are required" });
    }

    const application = await JobApplication.create({
      applicantName,
      email,
      phone,
      position,
      resumeText,
      resumeUrl,
    });

    res.status(201).json({ message: "Application submitted", id: application._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/recruitment/screen/:id
 * HR: trigger AI resume screening for an application.
 */
router.post(
  "/screen/:id",
  auth,
  roleGuard(["admin", "hr_recruiter"]),
  async (req, res) => {
    try {
      const application = await JobApplication.findById(req.params.id);
      if (!application) return res.status(404).json({ message: "Application not found" });
      if (!application.resumeText) {
        return res.status(400).json({ message: "No resume text to screen" });
      }

      const jobDescription = req.body.jobDescription || `Position: ${application.position}`;

      let aiResult;
      try {
        aiResult = await screenResume(application.resumeText, jobDescription);
      } catch (aiErr) {
        console.error("AI screening failed:", aiErr.message);
        return res.status(502).json({ message: "AI screening temporarily unavailable" });
      }

      application.aiScore = aiResult.score;
      application.aiSummary = aiResult.summary;
      application.skillsMatched = aiResult.skillsMatched || [];
      application.skillsMissing = aiResult.skillsMissing || [];
      application.recommendation = aiResult.recommendation;
      application.aiReasoning = aiResult.reasoning;
      await application.save();

      res.json({ message: "Screening complete", aiResult, application });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * GET /api/recruitment/applications
 * HR/Admin: list all applications with filters.
 */
router.get(
  "/applications",
  auth,
  roleGuard(["admin", "hr_recruiter", "senior_manager"]),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        position,
        minScore,
        maxScore,
      } = req.query;

      const query = {};
      if (status) query.status = status;
      if (position) query.position = { $regex: position, $options: "i" };
      if (minScore || maxScore) {
        query.aiScore = {};
        if (minScore) query.aiScore.$gte = Number(minScore);
        if (maxScore) query.aiScore.$lte = Number(maxScore);
      }

      const [applications, total] = await Promise.all([
        JobApplication.find(query)
          .sort({ appliedAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit)),
        JobApplication.countDocuments(query),
      ]);

      res.json({
        applications,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

/**
 * PUT /api/recruitment/:id/status
 * HR: update application status.
 */
router.put(
  "/:id/status",
  auth,
  roleGuard(["admin", "hr_recruiter"]),
  async (req, res) => {
    try {
      const { status } = req.body;
      const application = await JobApplication.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      );
      if (!application) return res.status(404).json({ message: "Application not found" });
      res.json({ message: "Status updated", application });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
