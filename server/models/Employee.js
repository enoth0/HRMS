import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, trim: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    dateOfJoining: { type: Date, required: true },
    salary: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "onleave"],
      default: "active",
    },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    documents: [{ type: String }], // Array of file URLs
    /** Pre-computed embedding for semantic search */
    profileEmbedding: { type: [Number], default: undefined },
  },
  { timestamps: true }
);

// Indexes for performance
employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });

/**
 * Auto-generate employeeId before saving if not present.
 */
employeeSchema.pre("save", async function (next) {
  if (!this.employeeId) {
    const count = await mongoose.model("Employee").countDocuments();
    this.employeeId = `EMP-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

export default mongoose.model("Employee", employeeSchema);
