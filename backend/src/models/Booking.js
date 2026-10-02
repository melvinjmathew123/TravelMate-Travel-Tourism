import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  package: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
  travelDate: { type: Date, required: true },
  guests: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  paymentMethod: { type: String, default: "razorpay" },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String }
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
