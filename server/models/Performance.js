import mongoose from "mongoose";

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  target: { type: String, required: true },
  achieved: { type: String },
  score: { type: Number, min: 0, max: 10, default: 0 },
});

const performanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    reviewPeriod: { type: String, required: true }, // e.g. "Q1 2024"
    goals: [goalSchema],
    overallScore: { type: Number, min: 0, max: 100 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    aiSummary: { type: mongoose.Schema.Types.Mixed }, // Gemini-generated JSON
    status: {
      type: String,
      enum: ["draft", "submitted", "reviewed"],
      default: "draft",
    },
  },
  { timestamps: true }
);

performanceSchema.index({ employee: 1, reviewPeriod: 1 });

export default mongoose.model("Performance", performanceSchema);
