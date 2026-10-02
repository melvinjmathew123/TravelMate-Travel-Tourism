import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTravel } from "../context/TravelContext";

const CONTINENTS = [
  { label: "All Regions", value: "All" },
  { label: "🌏 Asia", value: "Asia" },
  { label: "🏰 Europe", value: "Europe" },
  { label: "🗽 Americas", value: "Americas" },
  { label: "🦁 Africa", value: "Africa" },
  { label: "🏝️ Oceania", value: "Oceania" },
  { label: "🕌 Middle East", value: "Middle East" },
];

export default function Destinations() {
  const { destinations, packages } = useTravel();
  const [q, setQ] = useState("");
  const [continent, setContinent] = useState("All");
  const [sort, setSort] = useState("default");
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tm_wishlist_dest") || "[]");
    } catch {
      return [];
    }
  });

  function toggleWishlist(e, id) {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("tm_wishlist_dest", JSON.stringify(next));
      return next;
    });
  }

  // Count packages per destination
  const packageCountMap = useMemo(() => {
    const map = {};
    packages.forEach((p) => {
      const dId = p.destination?._id || p.destination;
      if (dId) map[dId] = (map[dId] || 0) + 1;
    });
    return map;
  }, [packages]);

  const filtered = useMemo(() => {
    let list = destinations.filter((d) =>
      (d.name + " " + d.country + " " + (d.continent || "")).toLowerCase().includes(q.toLowerCase())
    );
    if (continent !== "All") {
      list = list.filter((d) =>
        (d.continent || d.country || "").toLowerCase().includes(continent.toLowerCase())
      );
    }
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "country") list = [...list].sort((a, b) => a.country.localeCompare(b.country));
    if (sort === "wishlist") {
      list = [...list].sort(
        (a, b) => (wishlist.includes(b._id) ? 1 : 0) - (wishlist.includes(a._id) ? 1 : 0)
      );
    }
    return list;
  }, [destinations, q, continent, sort, wishlist]);

  return (
    <main>
      {/* ── HERO BANNER ── */}
      <div className="page-hero-banner">
        <div
          className="page-hero-bg"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80')",
          }}
        />
        <div className="page-hero-overlay" />
        <div className="page-hero-content">
          <span className="eyebrow light">WORLD ATLAS • CURATED EXPERIENCES</span>
          <h1>Explore Iconic Destinations</h1>
          <p>
            From sun-drenched coastal havens to historic European alleys and alpine summits — find the place that calls to you.
          </p>
          <div className="page-hero-stats">
            <span>🌍 {destinations.length} Curated Regions</span>
            <span>•</span>
            <span>⭐ Inspected & Verified Stays</span>
            <span>•</span>
            <span>✈ 350+ Guided Packages</span>
          </div>
        </div>
      </div>

      <div className="section">
        {/* ── INTERACTIVE FILTER BAR ── */}
        <div className="destinations-filter-card">
          <div className="dest-search-row">
            <div className="dest-input-wrap">
              <span className="dest-search-icon">🔍</span>
              <input
                className="search"
                style={{ width: "100%", margin: 0 }}
                placeholder="Search destinations by city, country or vibe..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button className="dest-clear-btn" onClick={() => setQ("")}>
                  ✕
                </button>
              )}
            </div>

            <div className="dest-sort-wrap">
              <label>Sort By:</label>
              <select
                className="filter-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="default">Featured First</option>
                <option value="name">City (A–Z)</option>
                <option value="country">Country (A–Z)</option>
                <option value="wishlist">❤️ Wishlist First</option>
              </select>
            </div>
          </div>

          {/* Region Chips */}
          <div className="region-chips-scroll">
            {CONTINENTS.map((c) => (
              <button
                key={c.value}
                className={`region-chip ${continent === c.value ? "active" : ""}`}
                onClick={() => setContinent(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── RESULTS HEADER ── */}
        <div className="results-status-bar">
          <span>
            Showing <strong>{filtered.length}</strong> destinations{" "}
            {continent !== "All" && `in ${continent}`}
          </span>
          {wishlist.length > 0 && (
            <span className="wishlist-counter-badge">
              ❤️ {wishlist.length} saved in wishlist
            </span>
          )}
        </div>

        {/* ── DESTINATIONS GRID ── */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📍</div>
            <h3>No destinations match your search</h3>
            <p>Try clearing your search keyword or selecting a different continent region.</p>
            <button
              className="btn"
              onClick={() => {
                setQ("");
                setContinent("All");
              }}
            >
              Reset Filters 🔄
            </button>
          </div>
        ) : (
          <div className="destgrid modern-destgrid">
            {filtered.map((d, i) => {
              const isSaved = wishlist.includes(d._id);
              const pCount = packageCountMap[d._id] || 0;

              return (
                <Link
                  to={`/packages?q=${encodeURIComponent(d.name)}`}
                  key={d._id}
                  className="dest modern-dest-card animate-up"
                  style={{ animationDelay: `${(i % 6) * 0.08}s` }}
                >
                  <img
                    src={
                      d.image ||
                      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={d.name}
                    loading="lazy"
                  />
                  <div className="dest-glass-badge">
                    <span>{pCount > 0 ? `${pCount} Packages Available` : "Featured Spot"}</span>
                  </div>

                  <button
                    className={`dest-heart-btn ${isSaved ? "active" : ""}`}
                    onClick={(e) => toggleWishlist(e, d._id)}
                    title={isSaved ? "Remove from wishlist" : "Save destination"}
                    aria-label="Save destination"
                  >
                    {isSaved ? "❤️" : "🤍"}
                  </button>

                  <div className="dest-info">
                    <h3>{d.name}</h3>
                    <div className="dest-meta">
                      <span className="dest-country">📍 {d.country}</span>
                      <span className="dest-badge">Best: {d.bestTime || "Year-round"}</span>
                    </div>
                    {d.description && (
                      <p className="dest-desc-preview">
                        {d.description.slice(0, 80)}…
                      </p>
                    )}
                    <span className="dest-explore-cta">
                      Explore Trips <span className="arrow">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
