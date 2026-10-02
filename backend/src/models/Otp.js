import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  password: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Automatically removed by MongoDB after 10 minutes (600 seconds)
  }
});

export default mongoose.model("Otp", otpSchema);
