import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useTravel } from "../context/TravelContext";
import PaymentModal from "../components/PaymentModal";
import { processRazorpayPayment } from "../utils/razorpay";

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=900&q=80",
];

const ITINERARY_TEMPLATES = [
  { title: "Arrival & Welcome", desc: "Arrive at your destination, check in to your hotel, and enjoy a welcome orientation tour of the city." },
  { title: "Sightseeing & Exploration", desc: "Full-day guided tour covering the most iconic landmarks, local markets, and cultural hotspots." },
  { title: "Adventure Activities", desc: "Thrilling outdoor activities curated for your destination — hiking, water sports, or wildlife safaris." },
  { title: "Free Day & Leisure", desc: "A relaxed day at your own pace — explore hidden gems, indulge in local cuisine, or simply unwind." },
  { title: "Cultural Immersion", desc: "Authentic cultural experiences: cooking classes, temple visits, traditional performances, and more." },
  { title: "Day Trip to Surroundings", desc: "Scenic excursion to nearby attractions, villages, or natural wonders not to be missed." },
  { title: "Shopping & Farewell", desc: "Last-minute shopping for souvenirs, check out, and transfer to the airport. Farewell dinner included." },
];

export default function PackageDetails() {
  const { id } = useParams();
  const { user } = useTravel();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [activeTab, setActiveTab] = useState("overview");

  // Gallery
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Payment states
  const [isBooking, setIsBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrderData, setCurrentOrderData] = useState(null);
  const [confirmMockFn, setConfirmMockFn] = useState(null);

  useEffect(() => {
    Promise.all([api.get(`/packages/${id}`), api.get(`/reviews/${id}`)])
      .then(([a, b]) => { setItem(a.data); setReviews(b.data); });
  }, [id]);

  // Build gallery images
  const galleryImages = item
    ? [
        item.image || item.destination?.image,
        item.destination?.image,
        ...PLACEHOLDER_IMAGES,
      ].filter(Boolean).slice(0, 5)
    : [];

  const prevSlide = useCallback(() => setGalleryIdx(i => (i - 1 + galleryImages.length) % galleryImages.length), [galleryImages.length]);
  const nextSlide = useCallback(() => setGalleryIdx(i => (i + 1) % galleryImages.length), [galleryImages.length]);

  // Keyboard lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = e => {
      if (e.key === "ArrowLeft") setLightboxIdx(i => (i - 1 + galleryImages.length) % galleryImages.length);
      if (e.key === "ArrowRight") setLightboxIdx(i => (i + 1) % galleryImages.length);
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, galleryImages.length]);

  async function book(e) {
    e.preventDefault();
    if (!user) return navigate("/login");
    setIsBooking(true);
    setMsg({ text: "", type: "" });

    try {
      const result = await processRazorpayPayment({
        packageId: id,
        travelDate: date,
        guests: Number(guests),
        user,
        packageData: item,
        onSuccess: (data) => {
          setMsg({
            text: "🎉 Payment successful! Your trip is confirmed. Check My Bookings.",
            type: "success"
          });
          setIsBooking(false);
        },
        onError: (errText) => {
          setMsg({ text: errText || "Payment cancelled or failed", type: "error-msg" });
          setIsBooking(false);
        }
      });

      if (result?.needsSimulationModal) {
        setCurrentOrderData(result.orderData);
        setConfirmMockFn(() => result.confirmMockPayment);
        setShowPaymentModal(true);
      }
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || err.message || "Booking failed",
        type: "error-msg"
      });
      setIsBooking(false);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (!reviewRating) return setReviewMsg("Please select a star rating.");
    setReviewSubmitting(true);
    try {
      await api.post(`/reviews/${id}`, { rating: reviewRating, comment: reviewComment });
      const { data } = await api.get(`/reviews/${id}`);
      setReviews(data);
      setReviewRating(0);
      setReviewComment("");
      setReviewMsg("✅ Review submitted! Thank you.");
    } catch (err) {
      setReviewMsg(err.response?.data?.message || "Could not submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  const totalPrice = item ? (item.price * guests).toLocaleString() : "—";

  // Build itinerary days
  const itineraryDays = item
    ? Array.from({ length: Math.min(item.duration, 7) }, (_, i) => ({
        day: i + 1,
        title: ITINERARY_TEMPLATES[i % ITINERARY_TEMPLATES.length].title,
        desc: ITINERARY_TEMPLATES[i % ITINERARY_TEMPLATES.length].desc,
      }))
    : [];

  if (!item) return (
    <main className="section" style={{ textAlign: "center", padding: "120px 28px" }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>✈️</div>
      <p style={{ color: "var(--muted)", fontSize: 18 }}>Loading package details…</p>
    </main>
  );

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(false)}>
          <img
            className="lightbox-img"
            src={galleryImages[lightboxIdx]}
            alt="Gallery"
            onClick={e => e.stopPropagation()}
          />
          <button className="lightbox-close" onClick={() => setLightbox(false)}>✕</button>
          <button className="lightbox-nav-btn lightbox-prev" onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + galleryImages.length) % galleryImages.length); }}>‹</button>
          <button className="lightbox-nav-btn lightbox-next" onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % galleryImages.length); }}>›</button>
        </div>
      )}

      <main className="section detail">
        {/* LEFT: Gallery */}
        <div className="detail-left">
          <div
            className="gallery-main"
            onClick={() => { setLightboxIdx(galleryIdx); setLightbox(true); }}
            title="Click to enlarge"
          >
            <img src={galleryImages[galleryIdx]} alt={item.title} />
            <div className="gallery-nav">
              <button className="gallery-btn" onClick={e => { e.stopPropagation(); prevSlide(); }}>‹</button>
              <button className="gallery-btn" onClick={e => { e.stopPropagation(); nextSlide(); }}>›</button>
            </div>
            <span className="gallery-counter">{galleryIdx + 1} / {galleryImages.length}</span>
          </div>
          <div className="gallery-thumbs">
            {galleryImages.map((img, i) => (
              <div
                key={i}
                className={`gallery-thumb${galleryIdx === i ? " active" : ""}`}
                onClick={() => setGalleryIdx(i)}
              >
                <img src={img} alt={`View ${i + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Content */}
        <div className="detailcontent">
          <span className="pill">📍 {item.destination?.name || "Travel Package"}</span>
          <h1>{item.title}</h1>
          <div className="detail-highlights">
            <span className="pill">⏱ {item.duration} days</span>
            <span className="pill">👥 Group friendly</span>
            <span className="pill">⭐ Top rated</span>
            {item.inclusions?.length > 0 && <span className="pill">✓ {item.inclusions.length} inclusions</span>}
          </div>

          <div className="detail-price-row">
            <span className="detail-price">₹{item.price.toLocaleString()}</span>
            <span className="detail-price-per">/ person</span>
          </div>

          {/* Tabs */}
          <div className="detail-tabs">
            {[
              { id: "overview", label: "Overview" },
              { id: "itinerary", label: "Itinerary" },
              { id: "inclusions", label: "Inclusions" },
            ].map(t => (
              <button
                key={t.id}
                className={`detail-tab${activeTab === t.id ? " active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={`detail-tab-content${activeTab === "overview" ? " active" : ""}`}>
            <p style={{ color: "var(--muted)", lineHeight: 1.85, fontSize: 16 }}>{item.description}</p>
            <div style={{ marginTop: 20, padding: "16px 20px", background: "var(--green-pale)", borderRadius: "var(--radius-sm)" }}>
              <p style={{ color: "var(--green)", fontWeight: 600, fontSize: 14 }}>
                📍 Destination: {item.destination?.name}, {item.destination?.country}
              </p>
            </div>
          </div>

          <div className={`detail-tab-content${activeTab === "itinerary" ? " active" : ""}`}>
            <div className="itinerary">
              {itineraryDays.map(day => (
                <div className="itinerary-day" key={day.day}>
                  <div className="itinerary-day-left">
                    <div className="itinerary-dot">{day.day}</div>
                    <div className="itinerary-line" />
                  </div>
                  <div className="itinerary-day-content">
                    <div className="itinerary-day-title">Day {day.day}: {day.title}</div>
                    <div className="itinerary-day-desc">{day.desc}</div>
                  </div>
                </div>
              ))}
              {item.duration > 7 && (
                <p style={{ color: "var(--muted)", fontSize: 14, fontStyle: "italic" }}>
                  + {item.duration - 7} more days of curated activities included in your package.
                </p>
              )}
            </div>
          </div>

          <div className={`detail-tab-content${activeTab === "inclusions" ? " active" : ""}`}>
            {item.inclusions?.length > 0 ? (
              <ul className="inclusion-list">
                {item.inclusions.map((inc, i) => <li key={i}>{inc}</li>)}
              </ul>
            ) : (
              <ul className="inclusion-list">
                {["Accommodation (4–5 star hotels)", "Daily breakfast & selected meals", "All transfers & local transport", "Professional English-speaking guide", "Entrance fees to all attractions", "24/7 TravelMate support"].map((inc, i) => (
                  <li key={i}>{inc}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Booking form */}
          <form className="bookingbox modern-bookingbox" onSubmit={book}>
            <div className="bookingbox-header">
              <h3>Reserve Your Trip ✈</h3>
              <span className="bookingbox-badge">Instant Booking</span>
            </div>

            <div className="bookingbox-fields">
              <div className="form-field">
                <label>📅 Select Travel Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="form-field">
                <label>👥 Number of Travellers</label>
                <div className="stepper-input-wrap">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setGuests((g) => Math.max(1, Number(g) - 1))}
                    disabled={guests <= 1}
                  >
                    –
                  </button>
                  <span className="stepper-val">
                    {guests} {guests === 1 ? "Traveller" : "Travellers"}
                  </span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setGuests((g) => Math.min(20, Number(g) + 1))}
                    disabled={guests >= 20}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="booking-breakdown-card">
              <div className="breakdown-row">
                <span>₹{item.price.toLocaleString()} × {guests} guest{guests > 1 ? "s" : ""}</span>
                <span>₹{(item.price * guests).toLocaleString()}</span>
              </div>
              <div className="breakdown-row">
                <span>Taxes & Service Fees</span>
                <span style={{ color: "var(--green)", fontWeight: 700 }}>Included (₹0)</span>
              </div>
              <div className="breakdown-divider" />
              <div className="breakdown-total-row">
                <span>Total Amount</span>
                <strong className="breakdown-total-price">₹{totalPrice}</strong>
              </div>
            </div>

            <button className="btn modern-book-btn" type="submit" disabled={isBooking}>
              {isBooking ? (
                <span>
                  <span className="spinner" style={{ marginRight: 8 }} /> Initializing Secure Checkout…
                </span>
              ) : user ? (
                `Proceed to Payment ₹${totalPrice} 💳`
              ) : (
                "Sign In to Book →"
              )}
            </button>

            {/* Trust Points */}
            <div className="booking-trust-points">
              <div className="trust-item">
                <span>🔒</span>
                <span>256-bit Secure Razorpay Checkout</span>
              </div>
              <div className="trust-item">
                <span>⚡</span>
                <span>Instant Ticket & Confirmation Email</span>
              </div>
              <div className="trust-item">
                <span>🛡️</span>
                <span>Free cancellation up to 7 days prior</span>
              </div>
            </div>

            {msg.text && (
              <div className={`book-msg ${msg.type}`} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <div>{msg.text}</div>
                {msg.type === "success" && (
                  <button
                    type="button"
                    className="btn outline small"
                    style={{ alignSelf: "flex-start", marginTop: 4 }}
                    onClick={() => navigate("/bookings")}
                  >
                    View in My Bookings →
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Reviews */}
      <div style={{ background: "var(--bg)", borderTop: "1px solid var(--border)", padding: "60px 0" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto", padding: "0 28px" }}>
          <span className="eyebrow">TRAVELLER REVIEWS</span>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, fontWeight: 700, margin: "12px 0 36px", letterSpacing: ".4px" }}>
            What guests say ({reviews.length})
          </h2>

          {/* Review form */}
          {user && (
            <div className="review-form">
              <h4>Share your experience</h4>
              <div className="star-picker">
                {[1, 2, 3, 4, 5].map(s => (
                  <span
                    key={s}
                    className={(hoverRating || reviewRating) >= s ? "active" : ""}
                    onClick={() => setReviewRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                  >★</span>
                ))}
                {reviewRating > 0 && (
                  <span style={{ color: "var(--muted)", fontSize: 14, alignSelf: "center" }}>
                    {["", "Poor", "Fair", "Good", "Great", "Excellent"][reviewRating]}
                  </span>
                )}
              </div>
              <textarea
                placeholder="Tell others about your experience on this trip..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
              />
              <button
                className="btn"
                onClick={submitReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? "Submitting…" : "Submit Review ✓"}
              </button>
              {reviewMsg && <p style={{ marginTop: 12, color: "var(--green)", fontWeight: 600, fontSize: 14 }}>{reviewMsg}</p>}
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 40 }}>
              <div className="empty-icon">💬</div>
              <h3>No reviews yet</h3>
              <p>Be the first to share your experience!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {reviews.map(r => (
                <div className="review" key={r._id}>
                  <div className="review-header">
                    <div className="review-author">
                      <div className="review-avatar">{r.user?.name?.[0]?.toUpperCase() || "U"}</div>
                      <div>
                        <div className="review-name">{r.user?.name || "Traveller"}</div>
                        <div className="review-date">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : ""}</div>
                      </div>
                    </div>
                    <div className="review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  </div>
                  <p>{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderData={currentOrderData}
        packageData={item}
        guests={guests}
        travelDate={date}
        onConfirmSuccess={async () => {
          if (confirmMockFn) {
            await confirmMockFn();
          }
          setMsg({
            text: "🎉 Payment successful! Your trip is confirmed. Check My Bookings.",
            type: "success"
          });
          setIsBooking(false);
        }}
      />
    </>
  );
}
