import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTravel } from "../context/TravelContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useTravel();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">WELCOME BACK</span>
          <h1>Sign in to TravelMate</h1>
          <p>Access your bookings, saved trips, and personalized travel itineraries.</p>
        </div>

        {error && (
          <div className="error" style={{ marginBottom: 18 }}>
            ⚠️ {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email Address</label>
            <div className="auth-input-wrap">
              <input
                id="login-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <div className="auth-input-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-toggle-pwd"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label="Toggle password visibility"
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <button className="btn auth-btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <p className="auth-footer-link">
          Don't have an account yet?
          <Link to="/register">Create an account</Link>
        </p>

        <p style={{ textAlign: "center", marginTop: 14 }}>
          <Link to="/" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>
            ← Back to Home
          </Link>
        </p>
      </div>
    </main>
  );
}
