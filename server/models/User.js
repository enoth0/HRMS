import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "hr_recruiter", "senior_manager", "employee"],
      default: "employee",
    },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

// Index for fast lookup
userSchema.index({ email: 1 });

/**
 * Hash password before saving.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/**
 * Compare candidate password with stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
