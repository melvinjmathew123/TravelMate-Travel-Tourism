import crypto from "crypto";
import Booking from "../models/Booking.js";
import TravelPackage from "../models/Package.js";
import { getRazorpayInstance, getRazorpayKeyId } from "../config/razorpay.js";
import { sendBookingConfirmationEmail, sendBookingCancellationEmail } from "../utils/mailer.js";

// 1. Get Razorpay Public Config (Key ID & Mode)
export async function getRazorpayConfig(req, res) {
  const instance = getRazorpayInstance();
  res.json({
    keyId: getRazorpayKeyId(),
    isMock: !instance
  });
}

// 2. Create Razorpay Order & Booking Draft
export async function createPaymentOrder(req, res) {
  try {
    const { packageId, travelDate, guests, bookingId } = req.body;

    let booking;
    let pkg;
    let count;
    let totalAmount;

    if (bookingId) {
      // User is paying for an existing pending booking
      booking = await Booking.findOne({ _id: bookingId, user: req.user._id }).populate("package");
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (booking.paymentStatus === "paid") {
        return res.status(400).json({ message: "This booking is already paid" });
      }
      pkg = booking.package;
      totalAmount = booking.totalAmount;
    } else {
      // New booking flow
      if (!packageId) return res.status(400).json({ message: "Package ID is required" });
      pkg = await TravelPackage.findById(packageId);
      if (!pkg || !pkg.available) return res.status(404).json({ message: "Package is unavailable" });
      
      if (!travelDate || new Date(travelDate) < new Date()) {
        return res.status(400).json({ message: "Please select a valid future travel date" });
      }
      
      count = Number(guests);
      if (!count || count < 1) {
        return res.status(400).json({ message: "Guests count must be at least 1" });
      }

      totalAmount = pkg.price * count;

      // Create draft booking with status "pending"
      booking = await Booking.create({
        user: req.user._id,
        package: pkg._id,
        travelDate,
        guests: count,
        totalAmount,
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: "razorpay"
      });
    }

    const amountInPaise = Math.round(totalAmount * 100);
    const razorpay = getRazorpayInstance();

    if (razorpay) {
      // Live / Sandbox Razorpay order creation
      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `tm_${booking._id.toString().slice(-10)}`,
        notes: {
          bookingId: booking._id.toString(),
          packageTitle: pkg.title,
          userEmail: req.user.email
        }
      };

      const order = await razorpay.orders.create(options);

      booking.razorpayOrderId = order.id;
      await booking.save();

      return res.status(200).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: getRazorpayKeyId(),
        bookingId: booking._id,
        booking,
        isMock: false
      });
    } else {
      // Simulated / Sandbox fallback when Razorpay credentials are not yet set in .env
      const mockOrderId = `order_mock_${Date.now()}`;
      booking.razorpayOrderId = mockOrderId;
      await booking.save();

      return res.status(200).json({
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: "INR",
        keyId: getRazorpayKeyId(),
        bookingId: booking._id,
        booking,
        isMock: true
      });
    }
  } catch (error) {
    console.error("Payment order error:", error);
    res.status(500).json({ message: error.message || "Failed to create payment order" });
  }
}

// 3. Verify Razorpay Payment Signature & Confirm Booking
export async function verifyPayment(req, res) {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, isMock } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id }).populate("package");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const razorpay = getRazorpayInstance();

    if (razorpay && keySecret && !isMock) {
      // Verify signature using HMAC SHA256
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        booking.paymentStatus = "failed";
        await booking.save();
        return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
      }
    }

    // Mark as paid and confirmed
    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    booking.razorpayPaymentId = razorpayPaymentId || `pay_mock_${Date.now()}`;
    booking.razorpaySignature = razorpaySignature || "mock_signature_approved";
    if (razorpayOrderId) booking.razorpayOrderId = razorpayOrderId;
    await booking.save();

    // Send confirmation email asynchronously
    sendBookingConfirmationEmail(booking, req.user, booking.package).catch(err =>
      console.error("Booking email error:", err)
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully! Your trip is confirmed.",
      booking
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: error.message || "Failed to verify payment" });
  }
}

// 4. Standard Booking Creation (Fallback / Direct)
export async function createBooking(req, res) {
  const { packageId, travelDate, guests } = req.body;
  const pkg = await TravelPackage.findById(packageId);
  if (!pkg || !pkg.available) return res.status(404).json({ message: "Package unavailable" });
  if (!travelDate || new Date(travelDate) < new Date()) return res.status(400).json({ message: "Choose a future travel date" });
  const count = Number(guests);
  if (!count || count < 1) return res.status(400).json({ message: "Guests must be at least 1" });

  const booking = await Booking.create({
    user: req.user._id,
    package: pkg._id,
    travelDate,
    guests: count,
    totalAmount: pkg.price * count,
    status: "confirmed",
    paymentStatus: "paid"
  });

  // Send confirmation email asynchronously
  sendBookingConfirmationEmail(booking, req.user, pkg).catch(err =>
    console.error("Booking email error:", err)
  );

  res.status(201).json(await booking.populate("package", "title price"));
}

export async function myBookings(req, res) {
  res.json(await Booking.find({ user: req.user._id }).populate("package").sort({ createdAt: -1 }));
}

export async function allBookings(req, res) {
  res.json(
    await Booking.find()
      .populate("user", "name email")
      .populate("package", "title price")
      .sort({ createdAt: -1 })
  );
}

export async function cancelBooking(req, res) {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id }).populate("package");
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  booking.status = "cancelled";
  if (booking.paymentStatus === "paid") {
    booking.paymentStatus = "refunded";
  }
  await booking.save();

  // Send cancellation email asynchronously
  sendBookingCancellationEmail(booking, req.user, booking.package).catch(err =>
    console.error("Cancellation email error:", err)
  );

  res.json(booking);
}

export async function updateBookingStatus(req, res) {
  const updates = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.paymentStatus) updates.paymentStatus = req.body.paymentStatus;

  const booking = await Booking.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
}
