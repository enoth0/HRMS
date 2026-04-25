import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    hoursWorked: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["present", "absent", "half-day", "wfh"],
      default: "present",
    },
    location: { type: String },
  },
  { timestamps: true }
);

// Compound index for employee + date lookups
attendanceSchema.index({ employee: 1, date: -1 });
attendanceSchema.index({ date: -1 });

export default mongoose.model("Attendance", attendanceSchema);
