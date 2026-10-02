import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useTravel } from "../context/TravelContext";
import PackageCard from "../components/PackageCard";

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    location: "Mumbai, India",
    trip: "Maldives Luxury Escape",
    rating: 5,
    text: "TravelMate exceeded every expectation! The booking was seamless, the resort was heaven on earth, and having 24/7 concierge assistance made our honeymoon completely stress-free.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Rohan Mehta",
    location: "Bangalore, India",
    trip: "Swiss Alps & Italian Lakes",
    rating: 5,
    text: "From the panoramic trains to boutique alpine chalets, every detail was flawlessly organized. The local guides were deeply knowledgeable. Truly a 5-star experience!",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Anjali Nair",
    location: "Kochi, India",
    trip: "Bali Spiritual & Cultural Retreat",
    rating: 5,
    text: "Bali was magical! TravelMate arranged private temple sunrise viewings, jungle villas, and organic culinary masterclasses. Cannot wait to book our next trip with them.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
  },
];

const WHY_US = [
  {
    icon: "🛡️",
    badge: "100% PROTECTED",
    title: "Complete Travel Protection",
    desc: "Every booking includes flexible cancellation policies, comprehensive transit protection, and 24/7 emergency support.",
  },
  {
    icon: "💎",
    badge: "VERIFIED LUXURY",
    title: "Handpicked 4 & 5-Star Stays",
    desc: "Every hotel, villa, and resort is personally vetted by our quality inspectors for comfort, safety, and authentic hospitality.",
  },
  {
    icon: "🧭",
    badge: "LOCAL EXPERTS",
    title: "Curated Master Itineraries",
    desc: "Crafted by passionate regional insiders who know the hidden viewpoints, quiet cafes, and unforgettable local traditions.",
  },
  {
    icon: "💳",
    badge: "EASY CHECKOUT",
    title: "Instant Secure Payments",
    desc: "Seamless, certified payment processing via UPI, Credit/Debit Cards, and NetBanking with instant booking confirmation.",
  },
];

const QUICK_TAGS = [
  { label: "🏖️ Beach Escapes", q: "Beach" },
  { label: "🏔️ Mountain Treks", q: "Mountain" },
  { label: "🏛️ Heritage Tours", q: "Heritage" },
  { label: "🌿 Wellness Retreats", q: "Wellness" },
  { label: "⛵ Island Hopping", q: "Island" },
];

function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        observer.disconnect();
        let start = 0;
        const step = Math.ceil(target / (duration / 16));
        const timer = setInterval(() => {
          start += step;
          if (start >= target) {
            setCount(target);
            clearInterval(timer);
          } else setCount(start);
        }, 16);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return [count, ref];
}

function StatItem({ num, suffix, label }) {
  const [count, ref] = useCountUp(num);
  return (
    <div className="stat-item" ref={ref}>
      <div className="stat-num">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Home() {
  const { packages, destinations } = useTravel();
  const navigate = useNavigate();
  const [dest, setDest] = useState("");
  const [when, setWhen] = useState("");
  const [guests, setGuests] = useState("2");
  const [emailSub, setEmailSub] = useState("");
  const [subDone, setSubDone] = useState(false);

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/packages?q=${encodeURIComponent(dest)}`);
  }

  function handleQuickTag(q) {
    navigate(`/packages?q=${encodeURIComponent(q)}`);
  }

  return (
    <main className="home-page-root">
      {/* ── LUXURY HERO BANNER ── */}
      <section className="hero-luxury">
        <div className="hero-luxury-bg">
          <img
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=85"
            alt="Travel Landscape"
            className="hero-luxury-img"
          />
          <div className="hero-luxury-overlay" />
        </div>

        <div className="hero-luxury-container">
          <div className="hero-luxury-content">
            <div className="hero-pill-badge animate-up">
              <span className="hero-sparkle">✨</span>
              <span>EXTRAORDINARY EXPERIENCES AWAIT</span>
            </div>

            <h1 className="hero-luxury-title animate-up">
              Discover Journeys That <br />
              <span className="hero-gradient-text">Touch Your Soul</span>
            </h1>

            <p className="hero-luxury-sub animate-up">
              Handpicked boutique stays, bespoke regional itineraries, and seamless booking for discerning travelers worldwide.
            </p>

            {/* Quick Action Badges */}
            <div className="hero-perks-row animate-up">
              <div className="hero-perk">
                <span className="perk-icon">⭐</span>
                <span><strong>4.9/5</strong> from 12k+ Travellers</span>
              </div>
              <div className="hero-perk-dot">•</div>
              <div className="hero-perk">
                <span className="perk-icon">🛡️</span>
                <span>Verified Stays & Safe Booking</span>
              </div>
              <div className="hero-perk-dot">•</div>
              <div className="hero-perk">
                <span className="perk-icon">💳</span>
                <span>Instant Payment & Confirmation</span>
              </div>
            </div>
          </div>

          {/* ── FLOATING LUXURY SEARCH WIDGET ── */}
          <div className="hero-search-wrapper animate-up">
            <form className="hero-search-card" onSubmit={handleSearch}>
              <div className="search-field-box">
                <span className="search-field-icon">📍</span>
                <div className="search-field-input-wrap">
                  <label>Destination</label>
                  <input
                    type="text"
                    placeholder="Where to? (e.g. Bali, Paris, Goa)"
                    value={dest}
                    onChange={(e) => setDest(e.target.value)}
                  />
                </div>
              </div>

              <div className="search-divider" />

              <div className="search-field-box">
                <span className="search-field-icon">📅</span>
                <div className="search-field-input-wrap">
                  <label>Departure Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                  />
                </div>
              </div>

              <div className="search-divider" />

              <div className="search-field-box">
                <span className="search-field-icon">👥</span>
                <div className="search-field-input-wrap">
                  <label>Travellers</label>
                  <select value={guests} onChange={(e) => setGuests(e.target.value)}>
                    <option value="1">1 Solo Explorer</option>
                    <option value="2">2 Guests (Couple)</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests (Family)</option>
                    <option value="5">5+ Guests (Group)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="hero-search-submit">
                <span>Explore Trips</span>
                <span className="btn-arrow">→</span>
              </button>
            </form>

            {/* Quick Filter Tags */}
            <div className="hero-quick-tags">
              <span className="quick-tags-label">Trending Now:</span>
              <div className="quick-tags-list">
                {QUICK_TAGS.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="quick-tag-chip"
                    onClick={() => handleQuickTag(t.q)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS COUNTER STRIP ── */}
      <section className="stats-bar">
        <StatItem num={12400} suffix="+" label="Happy Travellers" />
        <StatItem num={120} suffix="+" label="Curated Destinations" />
        <StatItem num={350} suffix="+" label="Exclusive Packages" />
        <StatItem num={99} suffix="%" label="Guest Satisfaction" />
      </section>

      {/* ── TOP DESTINATIONS SECTION ── */}
      <section className="section destinations-showcase">
        <div className="sectionhead">
          <div>
            <span className="eyebrow">ICONIC GETAWAYS</span>
            <h2>Top Destinations</h2>
            <p>Captivating lands celebrated by wanderers and connoisseurs alike.</p>
          </div>
          <Link className="view-all" to="/destinations">
            View All ({destinations.length}) →
          </Link>
        </div>

        <div className="destgrid">
          {destinations.slice(0, 3).map((d, i) => (
            <Link
              to={`/packages?q=${encodeURIComponent(d.name)}`}
              key={d._id}
              className="dest modern-dest-card animate-up"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <img
                src={d.image || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80"}
                alt={d.name}
                loading="lazy"
              />
              <div className="dest-glass-badge">
                {i === 0 ? "🔥 Featured" : "✨ Top Choice"}
              </div>
              <div className="dest-info">
                <h3>{d.name}</h3>
                <div className="dest-meta">
                  <span className="dest-country">📍 {d.country}</span>
                  <span className="dest-badge">Best: {d.bestTime || "Year-round"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="why-section">
        <div className="why-inner">
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
            <span className="eyebrow" style={{ color: "#7ec89f" }}>
              THE TRAVELMATE STANDARD
            </span>
            <h2
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "clamp(30px, 3.8vw, 44px)",
                fontWeight: 700,
                color: "#fff",
                marginTop: 10,
              }}
            >
              Crafted for unforgettable journeys
            </h2>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, marginTop: 8 }}>
              We take the uncertainty out of travel so you can focus on moments that matter.
            </p>
          </div>

          <div className="why-grid">
            {WHY_US.map((w, i) => (
              <div
                className="why-card modern-why-card animate-up"
                key={i}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="why-top-row">
                  <span className="why-icon">{w.icon}</span>
                  <span className="why-badge-pill">{w.badge}</span>
                </div>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CURATED TRAVEL PACKAGES ── */}
      <section className="section packages-showcase">
        <div className="sectionhead">
          <div>
            <span className="eyebrow">HANDPICKED EXPERIENCES</span>
            <h2>Curated Travel Packages</h2>
            <p>Inclusive itineraries featuring premium stays, transfers, and private guided excursions.</p>
          </div>
          <Link className="view-all" to="/packages">
            View All ({packages.length}) →
          </Link>
        </div>

        <div className="grid">
          {packages.slice(0, 3).map((p) => (
            <PackageCard item={p} key={p._id} />
          ))}
        </div>
      </section>

      {/* ── REVIEWS & TESTIMONIALS ── */}
      <section className="testimonials-section">
        <div className="section" style={{ padding: "0 28px" }}>
          <div className="sectionhead" style={{ justifyContent: "center", textAlign: "center" }}>
            <div>
              <span className="eyebrow">VERIFIED REVIEWS</span>
              <h2>Loved by Travelers Worldwide</h2>
              <p>Real stories from adventurers who booked their dream vacation with TravelMate.</p>
            </div>
          </div>

          <div className="testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <div
                className="testi-card modern-testi-card animate-up"
                key={i}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="testi-quote-mark">“</div>
                <div className="testi-stars">{"★".repeat(t.rating)}</div>
                <p className="testi-text">"{t.text}"</p>

                <div className="testi-author">
                  <img className="testi-avatar" src={t.avatar} alt={t.name} />
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-loc">{t.location}</div>
                    <div className="testi-trip">✈ {t.trip}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER STRIP ── */}
      <section className="newsletter-section">
        <div className="newsletter-inner">
          <span className="eyebrow" style={{ color: "#a8d5bc" }}>
            EXCLUSIVE TRAVEL PRIVILEGES
          </span>
          <h2>Unlock Secret Getaways & 15% Off</h2>
          <p>
            Join 50,000+ discerning travelers receiving our curated weekly private sales, insider city guides, and members-only perks.
          </p>

          {subDone ? (
            <div className="newsletter-success animate-up">
              ✨ <strong>Welcome to the Circle!</strong> Check your inbox for your private 15% welcome voucher.
            </div>
          ) : (
            <form
              className="newsletter-form"
              onSubmit={(e) => {
                e.preventDefault();
                setSubDone(true);
              }}
            >
              <input
                type="email"
                placeholder="Enter your email (e.g. explorer@domain.com)..."
                value={emailSub}
                onChange={(e) => setEmailSub(e.target.value)}
                required
              />
              <button type="submit">Claim 15% Off →</button>
            </form>
          )}
        </div>
      </section>

      {/* ── LUXURY FOOTER ── */}
      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand">✈ TravelMate</span>
            <p>
              Architects of exceptional expeditions and luxury holidays. We blend personalized concierge guidance with effortless digital bookings.
            </p>
            <div className="footer-trust-strip">
              <span>🔒 256-Bit SSL Encrypted</span>
              <span>🛡 Verified Stays</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Explore</h4>
            <Link to="/destinations">Destinations</Link>
            <Link to="/packages">Curated Packages</Link>
            <Link to="/bookings">My Reservations</Link>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About TravelMate</a>
            <a href="#">Editorial & Guides</a>
            <a href="#">Sustainability Pledge</a>
            <a href="#">Careers</a>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <a href="#">24/7 Concierge Desk</a>
            <a href="#">Payment & Refunds</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Travel</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} TravelMate Inc. Crafted for extraordinary memories 🌱</span>
          <div className="footer-social">
            <a className="social-btn" href="#" aria-label="Instagram">📸</a>
            <a className="social-btn" href="#" aria-label="Twitter">🐦</a>
            <a className="social-btn" href="#" aria-label="Facebook">📘</a>
            <a className="social-btn" href="#" aria-label="YouTube">🎬</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
