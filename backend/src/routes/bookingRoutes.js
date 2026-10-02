import { Router } from "express";
import {
  createBooking,
  createPaymentOrder,
  verifyPayment,
  getRazorpayConfig,
  myBookings,
  allBookings,
  cancelBooking,
  updateBookingStatus
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = Router();

// Public / auth razorpay config
router.get("/config/razorpay", protect, getRazorpayConfig);

// Payment & Checkout endpoints
router.post("/checkout", protect, createPaymentOrder);
router.post("/verify", protect, verifyPayment);

// Standard bookings
router.post("/", protect, createBooking);
router.get("/my", protect, myBookings);
router.get("/", protect, adminOnly, allBookings);
router.put("/:id/cancel", protect, cancelBooking);
router.put("/:id/status", protect, adminOnly, updateBookingStatus);

export default router;
