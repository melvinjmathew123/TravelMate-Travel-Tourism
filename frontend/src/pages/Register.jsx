import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTravel } from "../context/TravelContext";
import api from "../services/api";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function Register() {
  // ── Step management ──
  const [step, setStep] = useState("form"); // "form" | "otp"

  // ── Form fields ──
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── OTP fields ──
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);

  // ── UI state ──
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const { login: contextLogin } = useTravel();
  const navigate = useNavigate();

  // ── Resend countdown timer ──
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  // ── Auto-focus first OTP input when step changes ──
  useEffect(() => {
    if (step === "otp" && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 200);
    }
  }, [step]);

  // ── Step 1: Send OTP ──
  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register/send-otp", {
        name,
        email,
        password,
      });
      setSuccess(data.message);
      setResendTimer(RESEND_COOLDOWN);
      setStep("otp");
      setOtpDigits(Array(OTP_LENGTH).fill(""));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to send verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ──
  async function handleVerifyOtp(e) {
    e?.preventDefault();
    setError("");

    const otpCode = otpDigits.join("");
    if (otpCode.length < OTP_LENGTH) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register/verify-otp", {
        email,
        otp: otpCode,
      });
      // Store token and user the same way context.register does
      localStorage.setItem("travelmate_token", data.token);
      localStorage.setItem("travelmate_user", JSON.stringify(data.user));
      // Reload user through context login path
      window.location.href = "/";
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Verification failed. Please check the code and try again."
      );
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  // ── OTP input handlers ──
  const handleOtpChange = useCallback(
    (index, value) => {
      // Allow only digits
      if (value && !/^\d$/.test(value)) return;

      const updated = [...otpDigits];
      updated[index] = value;
      setOtpDigits(updated);

      // Auto-advance
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all digits filled
      if (value && index === OTP_LENGTH - 1 && updated.every((d) => d)) {
        setTimeout(() => {
          const code = updated.join("");
          if (code.length === OTP_LENGTH) {
            handleVerifyOtp();
          }
        }, 150);
      }
    },
    [otpDigits, email]
  );

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;

    const updated = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => (updated[i] = ch));
    setOtpDigits(updated);

    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === OTP_LENGTH) {
      setTimeout(() => handleVerifyOtp(), 150);
    }
  }

  // ── Resend OTP ──
  async function handleResend() {
    if (resendTimer > 0) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register/send-otp", {
        name,
        email,
        password,
      });
      setSuccess("New verification code sent!");
      setResendTimer(RESEND_COOLDOWN);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to resend code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──
  return (
    <main className="auth-wrapper">
      <div className={`auth-card ${step === "otp" ? "otp-step" : ""}`}>
        {/* ── Step 1: Registration Form ── */}
        <div className={`auth-step ${step === "form" ? "active" : "hidden"}`}>
          <div className="auth-header">
            <span className="eyebrow">START YOUR ADVENTURE</span>
            <h1>Create your account</h1>
            <p>
              Join thousands of travellers discovering extraordinary journeys
              around the world.
            </p>
          </div>

          {error && step === "form" && (
            <div className="error" style={{ marginBottom: 18 }}>
              ⚠️ {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="auth-field">
              <label htmlFor="reg-name">Full Name</label>
              <div className="auth-input-wrap">
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="e.g. Maya Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-email">Email Address</label>
              <div className="auth-input-wrap">
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-password">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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
              <span
                style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}
              >
                Must be at least 6 characters
              </span>
            </div>

            <button className="btn auth-btn" type="submit" disabled={loading}>
              {loading ? "Sending code…" : "Continue →"}
            </button>
          </form>

          <p className="auth-footer-link">
            Already registered?
            <Link to="/login">Sign in here</Link>
          </p>

          <p style={{ textAlign: "center", marginTop: 14 }}>
            <Link
              to="/"
              style={{
                fontSize: 13,
                color: "var(--muted)",
                textDecoration: "none",
              }}
            >
              ← Back to Home
            </Link>
          </p>
        </div>

        {/* ── Step 2: OTP Verification ── */}
        <div className={`auth-step ${step === "otp" ? "active" : "hidden"}`}>
          <div className="auth-header">
            <div className="otp-icon">✉️</div>
            <span className="eyebrow">VERIFY YOUR EMAIL</span>
            <h1>Enter verification code</h1>
            <p>
              We've sent a 6-digit code to{" "}
              <strong className="otp-email-highlight">{email}</strong>. Enter it
              below to complete registration.
            </p>
          </div>

          {error && step === "otp" && (
            <div className="error" style={{ marginBottom: 18 }}>
              ⚠️ {error}
            </div>
          )}
          {success && step === "otp" && (
            <div className="otp-success">{success}</div>
          )}

          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="otp-inputs" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`otp-box ${digit ? "filled" : ""}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  aria-label={`Digit ${idx + 1}`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <button
              className="btn auth-btn"
              type="submit"
              disabled={loading || otpDigits.some((d) => !d)}
            >
              {loading ? "Verifying…" : "Verify & Create Account ✓"}
            </button>
          </form>

          <div className="otp-actions">
            <button
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={resendTimer > 0 || loading}
            >
              {resendTimer > 0
                ? `Resend code in ${resendTimer}s`
                : "Resend verification code"}
            </button>

            <button
              className="otp-back-btn"
              onClick={() => {
                setStep("form");
                setError("");
                setSuccess("");
              }}
            >
              ← Change email or details
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
