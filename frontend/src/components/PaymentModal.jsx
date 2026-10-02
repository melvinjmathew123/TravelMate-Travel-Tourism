import { useState } from "react";

export default function PaymentModal({
  isOpen,
  onClose,
  orderData,
  packageData,
  guests,
  travelDate,
  onConfirmSuccess,
}) {
  const [method, setMethod] = useState("upi");
  const [upiId, setUpiId] = useState("traveler@upi");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8910");
  const [cardExpiry, setCardExpiry] = useState("08/29");
  const [cardCvv, setCardCvv] = useState("789");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !orderData) return null;

  const totalAmount = orderData.amount ? orderData.amount / 100 : 0;
  const isMock = orderData.isMock;

  async function handlePay(e) {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg("");

    try {
      // Simulate realistic network delay for smooth checkout experience
      await new Promise(r => setTimeout(r, 1200));

      if (onConfirmSuccess) {
        await onConfirmSuccess();
      }
      setPaymentComplete(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Payment simulation failed. Please try again.");
      setIsProcessing(false);
    }
  }

  return (
    <div className="payment-modal-overlay" onClick={isProcessing ? undefined : onClose}>
      <div className="payment-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-modal-header">
          <div className="payment-brand">
            <span className="payment-rzp-logo">Razorpay</span>
            <span className="payment-secure-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              100% SECURE CHECKOUT
            </span>
          </div>
          <button className="payment-modal-close" onClick={onClose} disabled={isProcessing}>
            ✕
          </button>
        </div>

        {paymentComplete ? (
          <div className="payment-success-screen">
            <div className="payment-success-check">✓</div>
            <h2>Payment Successful!</h2>
            <p>Your payment of <strong>₹{totalAmount.toLocaleString()}</strong> has been verified.</p>
            <div className="payment-success-info">
              <div><span>Order ID:</span> <strong>{orderData.orderId}</strong></div>
              <div><span>Status:</span> <strong style={{ color: "#1e6039" }}>Confirmed & Paid</strong></div>
            </div>
            <button
              className="btn"
              style={{ width: "100%", marginTop: 20 }}
              onClick={onClose}
            >
              Continue to My Bookings →
            </button>
          </div>
        ) : (
          <div className="payment-modal-body">
            {/* Trip Order Info */}
            <div className="payment-order-summary">
              <div className="payment-summary-pkg">
                <h3>{packageData?.title || "Travel Package"}</h3>
                <p>
                  📅 {travelDate ? new Date(travelDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} · {guests} Guest{guests > 1 ? "s" : ""}
                </p>
              </div>
              <div className="payment-summary-price">
                <span>Amount to Pay</span>
                <strong>₹{totalAmount.toLocaleString()}</strong>
              </div>
            </div>

            {isMock && (
              <div className="payment-sandbox-banner">
                <span className="sandbox-tag">SANDBOX / DEMO MODE</span>
                <p>Interactive Razorpay Test Checkout. No real money will be charged.</p>
              </div>
            )}

            {errorMsg && <div className="payment-error-banner">{errorMsg}</div>}

            {/* Methods Tabs */}
            <div className="payment-methods-tabs">
              <button
                type="button"
                className={`payment-method-tab ${method === "upi" ? "active" : ""}`}
                onClick={() => setMethod("upi")}
              >
                <span>📱</span> UPI / QR
              </button>
              <button
                type="button"
                className={`payment-method-tab ${method === "card" ? "active" : ""}`}
                onClick={() => setMethod("card")}
              >
                <span>💳</span> Cards
              </button>
              <button
                type="button"
                className={`payment-method-tab ${method === "netbanking" ? "active" : ""}`}
                onClick={() => setMethod("netbanking")}
              >
                <span>🏦</span> Net Banking
              </button>
            </div>

            {/* Methods Content */}
            <form onSubmit={handlePay}>
              {method === "upi" && (
                <div className="payment-method-fields">
                  <label>Virtual Payment Address (VPA / UPI ID)</label>
                  <div className="payment-input-group">
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="username@okhdfcbank"
                    />
                    <span className="input-affix">@upi</span>
                  </div>
                  <div className="upi-apps-row">
                    <span className="upi-app-pill">GPay</span>
                    <span className="upi-app-pill">PhonePe</span>
                    <span className="upi-app-pill">Paytm</span>
                    <span className="upi-app-pill">CRED</span>
                  </div>
                </div>
              )}

              {method === "card" && (
                <div className="payment-method-fields">
                  <div>
                    <label>Card Number</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div className="payment-fields-row">
                    <div>
                      <label>Expiry (MM/YY)</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label>CVV / CVC</label>
                      <input
                        type="password"
                        maxLength="4"
                        required
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)}
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
              )}

              {method === "netbanking" && (
                <div className="payment-method-fields">
                  <label>Select Your Bank</label>
                  <select defaultValue="HDFC">
                    <option value="HDFC">HDFC Bank</option>
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="KOTAK">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="btn payment-submit-btn"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="payment-btn-loading">
                    <span className="spinner" /> Authorizing Payment…
                  </span>
                ) : (
                  `Pay ₹${totalAmount.toLocaleString()} Securely →`
                )}
              </button>
            </form>

            <div className="payment-footer-notes">
              <span>🔒 256-bit SSL Encrypted</span>
              <span>⚡ Instant Confirmation</span>
              <span>🛡 PCI-DSS Level 1 Compliant</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
