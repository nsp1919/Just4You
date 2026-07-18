"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      const msg =
        err.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : (err.message ?? "Login failed. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* ── Page ── */
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: radial-gradient(120% 120% at 50% 0%, #201430 0%, #18101e 45%, #0f0913 100%);
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* subtle grid overlay */
        .auth-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 224, 196, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 224, 196, 0.025) 1px, transparent 1px);
          background-size: 64px 64px;
          -webkit-mask-image: radial-gradient(circle at 50% 40%, #000 0%, transparent 75%);
          mask-image: radial-gradient(circle at 50% 40%, #000 0%, transparent 75%);
          pointer-events: none;
        }

        /* Warm ambient orbs */
        .auth-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(10px);
          pointer-events: none;
          z-index: 0;
        }
        .auth-orb.a {
          width: 460px; height: 460px;
          background: radial-gradient(circle, rgba(255,138,92,0.16), transparent 68%);
          top: -120px; left: -100px;
          animation: floatOrb 14s ease-in-out infinite;
        }
        .auth-orb.b {
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(255,95,147,0.15), transparent 68%);
          bottom: -140px; right: -110px;
          animation: floatOrb 18s ease-in-out infinite reverse;
        }

        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(30px, 40px); }
        }

        /* ── Card ── */
        .login {
          width: 100%;
          max-width: 400px;
          background: linear-gradient(180deg, rgba(38,24,48,0.92), rgba(24,16,30,0.92));
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
          padding: 44px 40px 36px;
          color: #fff5ec;
          border-radius: 26px;
          border: 1px solid rgba(255,224,196,0.12);
          box-shadow: 0 30px 70px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04);
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
          animation: cardIn 0.6s cubic-bezier(0.19, 1, 0.22, 1);
        }

        @keyframes cardIn {
          0%   { opacity: 0; transform: translateY(24px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Brand mark */
        .brand-badge {
          width: 52px; height: 52px;
          border-radius: 15px;
          background: linear-gradient(135deg, #ff8a5c, #ff5f93);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 12px 28px -8px rgba(255,95,147,0.6);
        }

        .h1 {
          display: block;
          text-align: center;
          font-family: var(--font-playfair), Georgia, serif;
          font-size: 1.65rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #fff5ec;
        }

        .ui {
          background: linear-gradient(90deg, #ff9e4f, #ff6f9c);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
        }

        .subtitle {
          text-align: center;
          font-size: 0.86rem;
          color: #b9a6be;
          margin: 10px 0 26px;
          line-height: 1.55;
        }

        /* ── Fields ── */
        .field {
          position: relative;
          margin-top: 14px;
        }
        .field .field-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #8f8098;
          pointer-events: none;
          transition: color 0.2s;
        }
        .login input[type="email"],
        .login input[type="password"],
        .login input[type="text"] {
          display: block;
          border: 1px solid rgba(255,224,196,0.1);
          outline: none;
          width: 100%;
          padding: 15px 18px 15px 48px;
          font-size: 0.92rem;
          border-radius: 14px;
          background: rgba(255,240,228,0.04);
          color: #fff5ec;
          font-family: inherit;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .login input::placeholder { color: #8f8098; }

        .login input[type="email"]:focus,
        .login input[type="password"]:focus,
        .login input[type="text"]:focus {
          border-color: rgba(255,138,92,0.55);
          background: rgba(255,240,228,0.06);
          box-shadow: 0 0 0 4px rgba(255,111,156,0.12);
        }
        .field:focus-within .field-icon { color: #ff9e4f; }

        .pw-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #8f8098;
          cursor: pointer;
          padding: 6px;
          display: flex;
          border-radius: 8px;
          transition: color 0.2s;
        }
        .pw-toggle:hover { color: #ffb877; }

        /* ── Submit ── */
        .btn {
          border: 0;
          outline: 0;
          width: 100%;
          margin-top: 22px;
          padding: 15px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: 0.01em;
          color: #2a1512;
          background: linear-gradient(135deg, #ffb877, #ff8a5c 45%, #ff5f93);
          background-size: 160% 160%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
          box-shadow: 0 14px 30px -10px rgba(255,95,147,0.55);
          transition: transform 0.18s ease, box-shadow 0.25s ease, background-position 0.5s ease;
        }
        .btn:hover:not(:disabled) {
          background-position: 100% 50%;
          transform: translateY(-2px);
          box-shadow: 0 18px 38px -10px rgba(255,95,147,0.7);
        }
        .btn:active:not(:disabled) { transform: translateY(0); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Footer switch ── */
        .switch-row {
          margin-top: 26px;
          padding-top: 22px;
          border-top: 1px solid rgba(255,224,196,0.08);
          text-align: center;
          font-size: 0.82rem;
          color: #8f8098;
        }
        .switch-row a {
          color: #ff9e4f;
          font-weight: 700;
          text-decoration: none;
        }
        .switch-row a:hover { text-decoration: underline; }

        /* ── Error ── */
        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          margin-bottom: 4px;
          font-size: 0.78rem;
          color: #ffb4b4;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.28);
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60%  { transform: translateX(-4px); }
          40%, 80%  { transform: translateX(4px); }
        }

        @media only screen and (max-width: 480px) {
          .login { padding: 36px 24px 30px; }
        }
      `}</style>

      <main className="auth-page">
        <div className="auth-orb a" />
        <div className="auth-orb b" />

        <div className="login">
          <div className="brand-badge">
            <Sparkles size={22} color="#fff" />
          </div>

          <span className="h1">
            Welcome back to <span className="ui">Just4You</span>
          </span>
          <p className="subtitle">
            Sign in to pick up where you left off and craft your next surprise.
          </p>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {error && (
              <div className="auth-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div className="field">
              <Mail size={17} className="field-icon" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <Lock size={17} className="field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn">
              {loading ? (
                "Signing you in…"
              ) : (
                <>
                  Sign In <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="switch-row">
            New to Just4You?{" "}
            <Link href="/register">Create an account</Link>
          </div>
        </div>
      </main>
    </>
  );
}
