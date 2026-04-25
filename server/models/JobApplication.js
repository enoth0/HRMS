import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
    applicantName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String },
    position: { type: String, required: true },
    resumeText: { type: String }, // Extracted plain-text resume
    resumeUrl: { type: String },
    aiScore: { type: Number, min: 0, max: 100, default: null },
    aiSummary: { type: String },
    skillsMatched: [{ type: String }],
    skillsMissing: [{ type: String }],
    recommendation: {
      type: String,
      enum: ["shortlist", "reject", "hold"],
      default: null,
    },
    aiReasoning: { type: String },
    status: {
      type: String,
      enum: ["pending", "shortlisted", "rejected", "hired"],
      default: "pending",
    },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ position: 1 });
jobApplicationSchema.index({ aiScore: -1 });

export default mongoose.model("JobApplication", jobApplicationSchema);
