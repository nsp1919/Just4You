"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Check } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setError("Please accept the terms to continue."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "This email is already registered. Please sign in."
          : (err.message ?? "Registration failed. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#84cc16", "#22c55e"];

  return (
    <>
      <style>{`
        /* ── Page ── */
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d1117;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          overflow: hidden;
          position: relative;
          padding: 20px 0;
        }

        .auth-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,239,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,239,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        /* ── Spinning rays ── */
        .auth-container {
          position: relative;
          width: 480px;
          height: 480px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          overflow: hidden;
          filter: drop-shadow(0 0 40px rgba(0,239,255,0.08));
        }

        .auth-container span {
          position: absolute;
          left: 0;
          width: 32px;
          height: 6px;
          background: #1a2d42;
          border-radius: 80px;
          transform-origin: 240px;
          transform: rotate(calc(var(--i) * (360deg / 50)));
          animation: blink 3s linear infinite;
          animation-delay: calc(var(--i) * (3s / 50));
        }

        @keyframes blink {
          0%   { background: #0ef; box-shadow: 0 0 6px #0ef; }
          25%  { background: #1a2d42; box-shadow: none; }
        }

        /* ── Register box ── */
        .login-box {
          position: absolute;
          width: 80%;
          z-index: 1;
          padding: 24px 22px;
          border-radius: 20px;
          background: rgba(15, 23, 42, 0.87);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(0, 239, 255, 0.08);
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }

        /* ── Logo ── */
        .auth-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 14px;
          text-decoration: none;
        }
        .auth-logo-emoji { font-size: 1.4rem; }
        .auth-logo-text {
          font-size: 1.2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #a855f7, #ec4899, #0ef);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .auth-title {
          font-size: 1.4em;
          color: #0ef;
          text-align: center;
          margin-bottom: 3px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }

        .auth-subtitle {
          font-size: 0.76em;
          color: #7b92a8;
          text-align: center;
          margin-bottom: 14px;
        }

        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          border-radius: 12px;
          margin-bottom: 10px;
          font-size: 0.78em;
          color: #f87171;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60%  { transform: translateX(-4px); }
          40%, 80%  { transform: translateX(4px); }
        }

        /* ── Floating label inputs ── */
        .input-box {
          position: relative;
          margin: 12px 0;
        }

        .input-box input {
          width: 100%;
          height: 44px;
          background: transparent;
          border: 2px solid #1e3248;
          outline: none;
          border-radius: 40px;
          font-size: 0.88em;
          color: #fff;
          padding: 0 16px;
          transition: border-color 0.4s, box-shadow 0.4s;
          box-sizing: border-box;
          font-family: inherit;
        }

        .input-box input:focus {
          border-color: #0ef;
          box-shadow: 0 0 0 3px rgba(0, 239, 255, 0.1);
        }

        .input-box label {
          position: absolute;
          top: 50%;
          left: 16px;
          transform: translateY(-50%);
          font-size: 0.88em;
          pointer-events: none;
          transition: all 0.35s ease;
          color: #7b92a8;
        }

        .input-box input:focus ~ label,
        .input-box input[data-filled="true"] ~ label {
          top: -8px;
          font-size: 0.7em;
          background: #0f1724;
          padding: 0 6px;
          color: #0ef;
          border-radius: 4px;
        }

        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #7b92a8;
          font-size: 1em;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: #0ef; }
        .eye-icon { width: 15px; height: 15px; }

        /* ── Password strength bar ── */
        .strength-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          padding: 0 4px;
        }
        .strength-bars {
          display: flex;
          gap: 4px;
          flex: 1;
        }
        .strength-bar {
          height: 3px;
          flex: 1;
          border-radius: 99px;
          transition: background 0.3s;
        }
        .strength-label {
          font-size: 0.7em;
          font-weight: 600;
        }

        /* ── Checkbox ── */
        .checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          margin: 12px 0;
        }
        .checkbox-box {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          flex-shrink: 0;
          margin-top: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .checkbox-text {
          font-size: 0.76em;
          color: #7b92a8;
          line-height: 1.5;
        }
        .checkbox-text a {
          color: #0ef;
          text-decoration: none;
        }
        .checkbox-text a:hover { opacity: 0.8; }

        /* ── Submit button ── */
        .auth-btn {
          width: 100%;
          height: 44px;
          background: linear-gradient(135deg, #0ef, #0ab8ff);
          border: none;
          outline: none;
          border-radius: 40px;
          cursor: pointer;
          font-size: 0.93em;
          color: #0d1117;
          font-weight: 700;
          letter-spacing: 0.3px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
          box-shadow: 0 4px 20px rgba(0, 239, 255, 0.25);
        }

        .auth-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(0, 239, 255, 0.4);
        }
        .auth-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .auth-link-row {
          margin-top: 12px;
          text-align: center;
          font-size: 0.8em;
          color: #7b92a8;
        }
        .auth-link-row a {
          color: #0ef;
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        .auth-link-row a:hover { opacity: 0.8; }

        /* ── Bouncing-ball loader (scaled down) ── */
        .ball-loader {
          position: relative;
          width: 72px;
          height: 50px;
        }
        .ball-loader::before {
          content: "";
          position: absolute;
          bottom: 16px;
          left: 28px;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #0d1117;
          animation: loading-bounce 0.5s ease-in-out infinite alternate;
        }
        .ball-loader::after {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          height: 4px;
          width: 26px;
          border-radius: 4px;
          box-shadow: 0 3px 0 #1e3248, -20px 28px 0 #1e3248, -40px 54px 0 #1e3248;
          animation: loading-step 1s ease-in-out infinite;
        }
        @keyframes loading-bounce {
          0%   { transform: scale(1, 0.7); }
          40%  { transform: scale(0.8, 1.2); }
          60%  { transform: scale(1, 1); }
          100% { bottom: 82px; }
        }
        @keyframes loading-step {
          0% {
            box-shadow: 0 6px 0 rgba(0,0,0,0), 0 6px 0 #1e3248, -20px 28px 0 #1e3248, -40px 54px 0 #1e3248;
          }
          100% {
            box-shadow: 0 6px 0 #1e3248, -20px 28px 0 #1e3248, -40px 54px 0 #1e3248, -40px 54px 0 rgba(0,0,0,0);
          }
        }
      `}</style>

      <main className="auth-page">
        <div className="auth-container">
          {Array.from({ length: 50 }, (_, i) => (
            <span key={i} style={{ ["--i" as any]: i }} />
          ))}

          <div className="login-box">
            {/* Logo */}
            <Link href="/" className="auth-logo">
              <span className="auth-logo-emoji">✨</span>
              <span className="auth-logo-text">Just4You</span>
            </Link>

            <h2 className="auth-title">Create your account</h2>
            <p className="auth-subtitle">Start creating beautiful surprise websites</p>

            {error && (
              <div className="auth-error">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Full name */}
              <div className="input-box">
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  data-filled={name.length > 0 ? "true" : "false"}
                />
                <label htmlFor="register-name">Your full name</label>
              </div>

              {/* Email */}
              <div className="input-box">
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  data-filled={email.length > 0 ? "true" : "false"}
                />
                <label htmlFor="register-email">Email address</label>
              </div>

              {/* Password + strength */}
              <div>
                <div className="input-box" style={{ marginBottom: 0 }}>
                  <input
                    id="register-password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={{ paddingRight: "44px" }}
                    data-filled={password.length > 0 ? "true" : "false"}
                  />
                  <label htmlFor="register-password">Create a password</label>
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? (
                      <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>

                {password.length > 0 && (
                  <div className="strength-row">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="strength-bar"
                          style={{
                            background:
                              i <= strength
                                ? strengthColor[strength]
                                : "rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: strengthColor[strength] }}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Terms checkbox */}
              <label className="checkbox-row">
                <div
                  className="checkbox-box"
                  onClick={() => setAgreed(!agreed)}
                  style={{
                    background: agreed
                      ? "linear-gradient(135deg, #0ef, #0ab8ff)"
                      : "rgba(255,255,255,0.04)",
                    border: agreed ? "none" : "1.5px solid #1e3248",
                  }}
                >
                  {agreed && <Check size={11} color="#0d1117" strokeWidth={3} />}
                </div>
                <span className="checkbox-text">
                  I agree to the{" "}
                  <Link href="/terms">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy">Privacy Policy</Link>
                </span>
              </label>

              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                className="auth-btn"
              >
                {loading ? (
                  <div className="ball-loader" />
                ) : (
                  <>
                    Create Account
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="auth-link-row">
              Already have an account?{" "}
              <Link href="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
