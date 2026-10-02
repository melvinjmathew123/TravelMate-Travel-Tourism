import { useState, useMemo } from "react";
import { useTravel } from "../context/TravelContext";
import PackageCard from "../components/PackageCard";
import { useSearchParams } from "react-router-dom";

const DURATIONS = [
  { label: "Any Duration", min: 0, max: Infinity },
  { label: "⚡ 1–3 Days", min: 1, max: 3 },
  { label: "🌤 4–7 Days", min: 4, max: 7 },
  { label: "🗺 8–14 Days", min: 8, max: 14 },
  { label: "🌟 15+ Days", min: 15, max: Infinity },
];

const PRICE_TIERS = [
  { label: "All Budgets", max: "" },
  { label: "Under ₹25,000", max: 25000 },
  { label: "Under ₹50,000", max: 50000 },
  { label: "Under ₹1,00,000", max: 100000 },
  { label: "Ultra Luxury", max: 250000 },
];

export default function Packages() {
  const { packages } = useTravel();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState("default");
  const [maxPrice, setMaxPrice] = useState("");
  const [durFilter, setDurFilter] = useState(0);

  const filtered = useMemo(() => {
    let list = packages.filter((p) => {
      const text = (
        p.title +
        " " +
        (p.destination?.name || "") +
        " " +
        (p.destination?.country || "")
      ).toLowerCase();

      if (q && !text.includes(q.toLowerCase())) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;
      const { min, max } = DURATIONS[durFilter];
      if (p.duration < min || p.duration > max) return false;
      return true;
    });

    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "duration-asc") list = [...list].sort((a, b) => a.duration - b.duration);
    if (sort === "duration-desc") list = [...list].sort((a, b) => b.duration - a.duration);
    if (sort === "name") list = [...list].sort((a, b) => a.title.localeCompare(b.title));

    return list;
  }, [packages, q, sort, maxPrice, durFilter]);

  function resetFilters() {
    setQ("");
    setSort("default");
    setMaxPrice("");
    setDurFilter(0);
    setSearchParams({});
  }

  const hasActiveFilters = q || maxPrice || durFilter !== 0 || sort !== "default";

  return (
    <main>
      {/* ── HERO BANNER ── */}
      <div className="page-hero-banner">
        <div
          className="page-hero-bg"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=1920&q=80')",
          }}
        />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="eyebrow light">CURATED ITINERARIES • ALL-INCLUSIVE</span>
          <h1>Tailored Travel Packages</h1>
          <p>
            Immerse yourself in authentic experiences with handpicked boutique hotels, private transfers, and dedicated concierge support.
          </p>
          <div className="page-hero-stats">
            <span>🧳 {packages.length} Handpicked Packages</span>
            <span>•</span>
            <span>🛡 Guaranteed Best Rates</span>
            <span>•</span>
            <span>✨ 100% Verified Inclusions</span>
          </div>
        </div>
      </div>

      <div className="section">
        {/* ── FILTER & SORT CONTROLS ── */}
        <div className="packages-filter-box">
          {/* Top Search & Sort Row */}
          <div className="pkg-filter-top-row">
            <div className="pkg-search-wrap">
              <span className="pkg-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search packages by title, landmark or country..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button className="pkg-clear-btn" onClick={() => setQ("")}>
                  ✕
                </button>
              )}
            </div>

            <div className="pkg-sort-wrap">
              <label>Sort:</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">⭐ Top Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="duration-asc">Duration: Short to Long</option>
                <option value="duration-desc">Duration: Long to Short</option>
                <option value="name">Alphabetical (A–Z)</option>
              </select>
            </div>
          </div>

          {/* Secondary Filters: Duration & Budget */}
          <div className="pkg-filter-pills-row">
            {/* Duration Pills */}
            <div className="filter-pill-cluster">
              <span className="cluster-label">Duration:</span>
              <div className="cluster-items">
                {DURATIONS.map((d, idx) => (
                  <button
                    key={idx}
                    className={`filter-tag-pill ${durFilter === idx ? "active" : ""}`}
                    onClick={() => setDurFilter(idx)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Pills */}
            <div className="filter-pill-cluster">
              <span className="cluster-label">Budget:</span>
              <div className="cluster-items">
                {PRICE_TIERS.map((tier, idx) => (
                  <button
                    key={idx}
                    className={`filter-tag-pill ${maxPrice === String(tier.max) ? "active" : ""}`}
                    onClick={() => setMaxPrice(String(tier.max))}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {hasActiveFilters && (
            <div className="active-filters-bar">
              <span className="active-filters-title">Active Filters:</span>
              {q && <span className="active-pill">Keyword: "{q}"</span>}
              {durFilter !== 0 && (
                <span className="active-pill">Duration: {DURATIONS[durFilter].label}</span>
              )}
              {maxPrice && (
                <span className="active-pill">
                  Max: ₹{Number(maxPrice).toLocaleString()}
                </span>
              )}
              {sort !== "default" && <span className="active-pill">Sorted</span>}

              <button className="reset-all-link" onClick={resetFilters}>
                Clear All ✕
              </button>
            </div>
          )}
        </div>

        {/* ── RESULTS HEADER ── */}
        <div className="results-status-bar">
          <span>
            Found <strong>{filtered.length}</strong> matching packages
          </span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            ⚡ Instant confirmation available for all packages
          </span>
        </div>

        {/* ── PACKAGES GRID ── */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧳</div>
            <h3>No packages match your criteria</h3>
            <p>
              Try expanding your budget, adjusting the duration, or clearing search keywords.
            </p>
            <button className="btn" onClick={resetFilters}>
              Reset All Filters 🔄
            </button>
          </div>
        ) : (
          <div className="grid modern-packages-grid">
            {filtered.map((item) => (
              <PackageCard item={item} key={item._id} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
