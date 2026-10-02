import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

const key_id = process.env.RAZORPAY_KEY_ID || "";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "";

let razorpayInstance = null;

if (key_id && key_secret && !key_id.includes("your_") && !key_secret.includes("your_")) {
  try {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
    console.log("[Razorpay] Initialized with Key ID:", key_id);
  } catch (err) {
    console.error("[Razorpay] Initialization error:", err.message);
  }
} else {
  console.log("[Razorpay] API keys not set or placeholder detected in .env. Razorpay will operate in sandbox/simulation mode.");
}

export const getRazorpayInstance = () => razorpayInstance;
export const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
