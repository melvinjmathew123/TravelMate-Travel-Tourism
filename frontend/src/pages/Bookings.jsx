import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import { useTravel } from "../context/TravelContext";
import PaymentModal from "../components/PaymentModal";
import { processRazorpayPayment } from "../utils/razorpay";

export default function Bookings() {
  const { user } = useTravel();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [payingBookingId, setPayingBookingId] = useState(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrderData, setCurrentOrderData] = useState(null);
  const [confirmMockFn, setConfirmMockFn] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  async function load() {
    try {
      setItems((await api.get("/bookings/my")).data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load bookings");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id) {
    if (!window.confirm("Are you sure you wish to cancel this reservation?")) return;
    setCancelling(id);
    try {
      await api.put(`/bookings/${id}/cancel`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Cancellation failed");
    } finally {
      setCancelling(null);
    }
  }

  async function payForBooking(booking) {
    setPayingBookingId(booking._id);
    setSelectedBooking(booking);

    try {
      const result = await processRazorpayPayment({
        bookingId: booking._id,
        user,
        packageData: booking.package,
        onSuccess: async () => {
          setPayingBookingId(null);
          await load();
        },
        onError: (errText) => {
          setPayingBookingId(null);
          setError(errText || "Payment could not be completed");
        },
      });

      if (result?.needsSimulationModal) {
        setCurrentOrderData(result.orderData);
        setConfirmMockFn(() => result.confirmMockPayment);
        setShowPaymentModal(true);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to initiate payment");
      setPayingBookingId(null);
    }
  }

  const confirmedCount = items.filter((b) => b.status === "confirmed" && b.paymentStatus === "paid").length;
  const pendingCount = items.filter((b) => b.paymentStatus !== "paid" && b.status !== "cancelled").length;

  return (
    <main className="section bookings-page modern-bookings-page">
      <div className="bookings-header-banner">
        <div>
          <span className="eyebrow">YOUR TRAVEL PASSPORT</span>
          <h1 className="bookings-page-title">My Bookings & Reservations</h1>
          <p className="bookings-page-sub">
            Track your upcoming itineraries, confirm pending payments, and view your travel confirmation vouchers.
          </p>
        </div>

        {items.length > 0 && (
          <div className="bookings-quick-stats">
            <div className="quick-stat-box">
              <span className="stat-value">{items.length}</span>
              <span className="stat-desc">Total Bookings</span>
            </div>
            <div className="quick-stat-box highlight">
              <span className="stat-value">{confirmedCount}</span>
              <span className="stat-desc">Confirmed & Paid</span>
            </div>
            {pendingCount > 0 && (
              <div className="quick-stat-box warning">
                <span className="stat-value">{pendingCount}</span>
                <span className="stat-desc">Pending Payment</span>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {!items.length && !error ? (
        <div className="empty-state modern-empty-state">
          <div className="empty-icon">🧳</div>
          <h3>No trips booked yet</h3>
          <p>
            Your next extraordinary expedition is waiting to be written. Browse our curated destinations and packages to begin.
          </p>
          <Link className="btn" to="/packages">
            Explore Packages ✈
          </Link>
        </div>
      ) : (
        <div className="bookings-list-wrap">
          {items.map((b) => {
            const formattedDate = new Date(b.travelDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const formattedBookedOn = b.createdAt
              ? new Date(b.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            const isPaid = b.paymentStatus === "paid";
            const isCancelled = b.status === "cancelled";

            return (
              <div
                className={`booking modern-booking-card ${isCancelled ? "is-cancelled" : ""}`}
                key={b._id}
              >
                {/* Left Media Preview */}
                <div className="booking-card-media">
                  <img
                    src={
                      b.package?.image ||
                      b.package?.destination?.image ||
                      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={b.package?.title}
                    loading="lazy"
                  />
                  <div className="booking-ref-tag">
                    #{b._id.slice(-6).toUpperCase()}
                  </div>
                </div>

                {/* Center Content */}
                <div className="booking-card-details">
                  <div className="booking-card-top-pills">
                    <span className={`status ${b.status}`}>{b.status}</span>
                    <span className={`pay-status ${b.paymentStatus || "pending"}`}>
                      {isPaid
                        ? "💳 Paid in Full"
                        : b.paymentStatus === "refunded"
                        ? "↩ Refunded"
                        : "⏳ Payment Pending"}
                    </span>
                    <span className="booked-on-text">Booked on {formattedBookedOn}</span>
                  </div>

                  <h3 className="booking-title">
                    {b.package?.title || "Curated Travel Journey"}
                  </h3>

                  <div className="booking-info-grid">
                    <div className="info-cell">
                      <span className="cell-label">📅 Departure Date</span>
                      <strong className="cell-value">{formattedDate}</strong>
                    </div>
                    <div className="info-cell">
                      <span className="cell-label">👥 Party Size</span>
                      <strong className="cell-value">
                        {b.guests} {b.guests === 1 ? "Traveller" : "Travellers"}
                      </strong>
                    </div>
                    <div className="info-cell">
                      <span className="cell-label">💰 Total Amount</span>
                      <strong className="cell-value total-highlight">
                        ₹{b.totalAmount?.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {b.razorpayPaymentId && (
                    <div className="booking-rzp-strip">
                      <span>⚡ Razorpay Reference:</span>
                      <code>{b.razorpayPaymentId}</code>
                    </div>
                  )}
                </div>

                {/* Right Action Panel */}
                <div className="booking-card-actions">
                  {!isCancelled && !isPaid && (
                    <button
                      className="btn modern-pay-btn"
                      onClick={() => payForBooking(b)}
                      disabled={payingBookingId === b._id}
                    >
                      {payingBookingId === b._id ? "Processing…" : "Complete Payment 💳"}
                    </button>
                  )}

                  <Link
                    className="btn outline small"
                    to={`/packages/${b.package?._id}`}
                  >
                    View Itinerary →
                  </Link>

                  {!isCancelled && (
                    <button
                      className="btn danger small outline-danger"
                      onClick={() => cancel(b._id)}
                      disabled={cancelling === b._id}
                    >
                      {cancelling === b._id ? "Cancelling…" : "Cancel Reservation"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal for Pending Booking Settlement */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPayingBookingId(null);
        }}
        orderData={currentOrderData}
        packageData={selectedBooking?.package}
        guests={selectedBooking?.guests}
        travelDate={selectedBooking?.travelDate}
        onConfirmSuccess={async () => {
          if (confirmMockFn) {
            await confirmMockFn();
          }
          await load();
          setPayingBookingId(null);
        }}
      />
    </main>
  );
}
