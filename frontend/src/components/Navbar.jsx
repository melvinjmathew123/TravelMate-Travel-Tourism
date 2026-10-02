import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTravel } from "../context/TravelContext";

export default function Navbar() {
  const { user, logout } = useTravel();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on page route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdown(false);
  }, [location.pathname]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className={`nav-wrapper ${scrolled ? "scrolled" : ""}`}>
      <nav className="nav">
        {/* Brand */}
        <Link className="brand" to="/">
          <span className="brand-icon">✈</span>
          <span className="brand-text">
            Travel<span className="brand-accent">Mate</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navlinks desktop-links">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            end
          >
            Home
          </NavLink>
          <NavLink
            to="/destinations"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Destinations
          </NavLink>
          <NavLink
            to="/packages"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Packages
          </NavLink>
          {user && (
            <NavLink
              to="/bookings"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              My Bookings
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item admin-pill ${isActive ? "active" : ""}`}
            >
              👑 Admin Portal
            </NavLink>
          )}
        </div>

        {/* Right side Actions */}
        <div className="nav-actions">
          {user ? (
            <div className="user-menu-rel">
              <button
                className="user-profile-btn"
                onClick={() => setUserDropdown(!userDropdown)}
                aria-label="User Menu"
              >
                <div className="user-avatar-circle">{initials}</div>
                <div className="user-info-text">
                  <span className="user-name-short">{user.name.split(" ")[0]}</span>
                  <span className="user-role-tag">{user.role === "admin" ? "Admin" : "Traveller"}</span>
                </div>
                <span className={`dropdown-chevron ${userDropdown ? "open" : ""}`}>▾</span>
              </button>

              {userDropdown && (
                <div className="user-dropdown-card">
                  <div className="dropdown-user-header">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/bookings" className="dropdown-link">
                    🧳 My Bookings
                  </Link>
                  {user.role === "admin" && (
                    <Link to="/admin" className="dropdown-link">
                      👑 Admin Dashboard
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-link logout-link"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns-group">
              <Link to="/login" className="nav-login-btn">
                Log In
              </Link>
              <Link to="/register" className="btn small nav-cta-btn">
                Get Started →
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            className={`hamburger-btn ${mobileMenuOpen ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <span className="ham-line" />
            <span className="ham-line" />
            <span className="ham-line" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? "open" : ""}`}>
        <div className="mobile-drawer-content">
          <NavLink to="/" className="mobile-nav-link" end>
            🏠 Home
          </NavLink>
          <NavLink to="/destinations" className="mobile-nav-link">
            📍 Destinations
          </NavLink>
          <NavLink to="/packages" className="mobile-nav-link">
            🧳 Packages & Trips
          </NavLink>
          {user && (
            <NavLink to="/bookings" className="mobile-nav-link">
              📅 My Bookings
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin" className="mobile-nav-link admin-nav-link">
              👑 Admin Dashboard
            </NavLink>
          )}

          <div className="mobile-drawer-divider" />

          {user ? (
            <div className="mobile-user-box">
              <div className="mobile-user-details">
                <div className="user-avatar-circle">{initials}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{user.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{user.email}</div>
                </div>
              </div>
              <button
                className="btn danger small"
                style={{ width: "100%", marginTop: 12 }}
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="mobile-auth-actions">
              <Link to="/login" className="btn outline" style={{ justifyContent: "center" }}>
                Sign In
              </Link>
              <Link to="/register" className="btn" style={{ justifyContent: "center" }}>
                Create Account →
              </Link>
            </div>
          )}
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}
    </header>
  );
}
