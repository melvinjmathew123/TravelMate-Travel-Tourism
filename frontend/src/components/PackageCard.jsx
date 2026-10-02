import { useState } from "react";
import { Link } from "react-router-dom";

// Stable pseudo-random generator based on string ID to prevent render jumping
function getStableRating(id = "") {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const rating = (4.3 + (Math.abs(hash) % 7) * 0.1).toFixed(1);
  const reviews = 42 + (Math.abs(hash) % 180);
  return { rating: Math.min(Number(rating), 5.0).toFixed(1), reviews };
}

export default function PackageCard({ item }) {
  const [liked, setLiked] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("tm_wishlist_pkg") || "[]");
      return stored.includes(item?._id);
    } catch {
      return false;
    }
  });

  const { rating, reviews } = getStableRating(item?._id || item?.title);

  function toggleLike(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = JSON.parse(localStorage.getItem("tm_wishlist_pkg") || "[]");
      const next = liked ? stored.filter((x) => x !== item?._id) : [...stored, item?._id];
      localStorage.setItem("tm_wishlist_pkg", JSON.stringify(next));
      setLiked(!liked);
    } catch {
      setLiked(!liked);
    }
  }

  const destinationName = item?.destination?.name || "Curated Expedition";
  const destinationCountry = item?.destination?.country || "Worldwide";

  return (
    <article className="card modern-travel-card animate-up">
      <div className="card-img-wrap">
        <img
          src={item.image || item.destination?.image || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80"}
          alt={item.title}
          loading="lazy"
          className="card-media-img"
        />
        <div className="card-img-overlay" />
        
        {/* Top Floating Badges */}
        <div className="card-top-badges">
          <span className="card-dest-tag">📍 {destinationName}</span>
          <button
            className={`card-wishlist-btn ${liked ? "active" : ""}`}
            onClick={toggleLike}
            title={liked ? "Remove from wishlist" : "Save to wishlist"}
            aria-label="Wishlist"
          >
            {liked ? "❤️" : "🤍"}
          </button>
        </div>

        {/* Bottom Floating Duration */}
        <div className="card-bottom-pill">
          <span>⏱ {item.duration} Days</span>
          {item.inclusions?.length > 0 && <span>• {item.inclusions.length} Inclusions</span>}
        </div>
      </div>

      <div className="cardbody modern-card-body">
        <div className="card-country-row">
          <span className="pill country-pill">{destinationCountry}</span>
          <div className="card-rating-mini">
            <span className="stars-gold">★</span>
            <strong>{rating}</strong>
            <span className="reviews-count">({reviews})</span>
          </div>
        </div>

        <h3 className="card-title">
          <Link to={`/packages/${item._id}`}>{item.title}</Link>
        </h3>

        <p className="card-desc">
          {item.description ? item.description.slice(0, 95) + "…" : "Experience exceptional journeys curated by local experts."}
        </p>

        <div className="card-footer-box">
          <div className="card-pricing-block">
            <span className="price-label">Starting from</span>
            <div className="card-price">
              ₹{item.price ? item.price.toLocaleString() : "—"}
              <small>/ person</small>
            </div>
          </div>
          
          <Link
            className="btn card-action-btn"
            to={`/packages/${item._id}`}
            aria-label={`View package ${item.title}`}
          >
            Book Trip <span className="btn-arrow">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
