import mongoose from "mongoose";

/**
 * Connects to MongoDB Atlas with connection pooling.
 * @returns {Promise<void>}
 */
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}
