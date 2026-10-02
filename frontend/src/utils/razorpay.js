import api from "../services/api";

/**
 * Dynamically loads the Razorpay checkout script if not already present.
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Handles the complete checkout and verification workflow.
 *
 * @param {Object} params
 * @param {string} [params.packageId] - Package ID for new booking
 * @param {string} [params.travelDate] - Selected date
 * @param {number} [params.guests] - Number of travellers
 * @param {string} [params.bookingId] - Booking ID if paying for existing pending booking
 * @param {Object} params.user - Current logged-in user
 * @param {Object} params.packageData - Package metadata (title, price, image)
 * @param {Function} params.onSuccess - Callback on verified payment
 * @param {Function} params.onError - Callback on payment failure/cancel
 */
export async function processRazorpayPayment({
  packageId,
  travelDate,
  guests,
  bookingId,
  user,
  packageData,
  onSuccess,
  onError,
}) {
  try {
    // 1. Create order on backend
    const { data: orderData } = await api.post("/bookings/checkout", {
      packageId,
      travelDate,
      guests,
      bookingId,
    });

    const { orderId, amount, currency, keyId, bookingId: currentBookingId, isMock } = orderData;

    // 2. Load script
    const scriptLoaded = await loadRazorpayScript();

    // 3. If mock mode or script blocked / placeholder key, use interactive simulated flow
    if (isMock || !scriptLoaded || !keyId || keyId.includes("placeholder") || keyId.includes("your_key")) {
      return {
        needsSimulationModal: true,
        orderData,
        confirmMockPayment: async () => {
          try {
            const verifyRes = await api.post("/bookings/verify", {
              bookingId: currentBookingId,
              razorpayOrderId: orderId,
              razorpayPaymentId: `pay_mock_${Date.now()}`,
              razorpaySignature: "mock_signature_approved",
              isMock: true,
            });
            if (onSuccess) onSuccess(verifyRes.data);
            return verifyRes.data;
          } catch (err) {
            if (onError) onError(err.response?.data?.message || "Payment verification failed");
            throw err;
          }
        },
      };
    }

    // 4. Real Razorpay Standard Checkout Popup
    return new Promise((resolve, reject) => {
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || "INR",
        name: "TravelMate",
        description: `Booking for ${packageData?.title || "Curated Journey"}`,
        image: "/favicon.ico",
        order_id: orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#1a5c42",
        },
        modal: {
          ondismiss: function () {
            if (onError) onError("Payment cancelled by user");
            reject(new Error("Payment cancelled"));
          },
        },
        handler: async function (response) {
          try {
            const verifyRes = await api.post("/bookings/verify", {
              bookingId: currentBookingId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              isMock: false,
            });

            if (onSuccess) onSuccess(verifyRes.data);
            resolve(verifyRes.data);
          } catch (err) {
            const errorMsg = err.response?.data?.message || "Payment verification failed on server";
            if (onError) onError(errorMsg);
            reject(new Error(errorMsg));
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (response) {
        const errorMsg = response.error?.description || "Payment failed";
        if (onError) onError(errorMsg);
        reject(new Error(errorMsg));
      });

      razorpayInstance.open();
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    if (onError) onError(error.response?.data?.message || error.message || "Failed to start checkout");
    throw error;
  }
}
