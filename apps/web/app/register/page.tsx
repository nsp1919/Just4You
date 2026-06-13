"use client";
import { useState, useEffect } from "react";
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
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const nameParam = params.get("name");
      const emailParam = params.get("email");
      if (nameParam) setName(nameParam);
      if (emailParam) setEmail(emailParam);
    }
  }, []);

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
    if (!agreed) {
      setError("Please accept the terms to continue.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
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
          background: #07070a;
          font-family: 'Space Grotesk', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 20px 0;
        }

        /* subtle grid overlay */
        .auth-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(168, 85, 247, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* Ambient Orbs */
        .auth-page::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(168,85,247,0.08), transparent 70%);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 0;
          pointer-events: none;
        }

        .login {
          width: 360px;
          height: auto;
          background: #18181b;
          padding: 40px 36px;
          color: #fff;
          border-radius: 17px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          font-size: 1.2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
        }

        .login input[type="text"],
        .login input[type="email"],
        .login input[type="password"] {
          opacity: 1;
          display: block;
          border: none;
          outline: none;
          width: 100%;
          padding: 12px 18px;
          margin: 16px 0 0 0;
          font-size: 0.8em;
          border-radius: 100px;
          background: #27272a;
          color: #fff;
          transition: background 0.2s;
        }

        .login input[type="text"]:focus,
        .login input[type="email"]:focus,
        .login input[type="password"]:focus {
          background: #3f3f46;
          animation: bounce 1s;
          -webkit-appearance: none;
        }

        .login input[type=submit],
        .login button[type=submit],
        .h1 {
          border: 0;
          outline: 0;
          width: 100%;
          padding: 13px;
          margin: 28px 0 0 0;
          border-radius: 500px;
          font-weight: 600;
          animation: bounce2 1.6s;
        }

        .h1 {
          padding: 0;
          position: relative;
          top: -16px;
          display: block;
          margin-bottom: -4px;
          font-size: 1.3em;
          text-align: center;
        }

        .btn {
          background: linear-gradient(144deg, #af40ff, #5b42f3 50%, #00ddeb);
          color: #fff;
          padding: 13px !important;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Grotesk', sans-serif;
        }

        .btn:hover:not(:disabled) {
          background: linear-gradient(144deg, #1e1e1e , 20%,#1e1e1e 50%,#1e1e1e );
          color: rgb(255, 255, 255);
          padding: 13px !important;
          cursor: pointer;
          transition: all 0.4s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login input[type=text],
        .login input[type=email] {
          animation: bounce 1s;
          -webkit-appearance: none;
        }

        .login input[type=password] {
          animation: bounce1 1.3s;
        }

        .ui {
          font-weight: bolder;
          background: -webkit-linear-gradient(#B563FF, #535EFC, #0EC8EE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          border-bottom: 4px solid transparent;
          border-image: linear-gradient(0.25turn, #535EFC, #0EC8EE, #0EC8EE);
          border-image-slice: 1;
          display: inline;
        }

        /* ── Password strength bar ── */
        .strength-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
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
          font-size: 0.65rem;
          font-weight: 600;
        }

        /* ── Checkbox ── */
        .checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          margin: 16px 0;
          user-select: none;
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
          font-size: 0.72rem;
          color: #7b92a8;
          line-height: 1.5;
        }
        .checkbox-text a {
          color: #B563FF;
          text-decoration: none;
        }
        .checkbox-text a:hover { opacity: 0.8; }

        .auth-error {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          margin-top: 10px;
          font-size: 0.72rem;
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

        @media only screen and (max-width: 600px) {
          .login {
            width: 90%;
            padding: 2.5em 1.5em;
          }
        }

        @keyframes bounce {
          0% {
            transform: translateY(-250px);
            opacity: 0;
          }
        }

        @keyframes bounce1 {
          0% {
            opacity: 0;
          }
          40% {
            transform: translateY(-100px);
            opacity: 0;
          }
        }

        @keyframes bounce2 {
          0% {
            opacity: 0;
          }
          70% {
            transform: translateY(-20px);
            opacity: 0;
          }
        }
      `}</style>

      <main className="auth-page">
        <div className="login">
          <span className="h1">
            Sign Up to <span className="ui">Just4You</span>
          </span>

          {error && (
            <div className="auth-error">
              <AlertCircle size={14} />
              <span style={{ marginLeft: 6 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            {/* Password strength */}
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

            {/* Terms checkbox */}
            <label className="checkbox-row">
              <div
                className="checkbox-box"
                onClick={() => setAgreed(!agreed)}
                style={{
                  background: agreed
                    ? "linear-gradient(135deg, #af40ff, #5b42f3)"
                    : "rgba(255,255,255,0.04)",
                  border: agreed ? "none" : "1.5px solid #3f3f46",
                }}
              >
                {agreed && <Check size={11} color="#fff" strokeWidth={3} />}
              </div>
              <span className="checkbox-text">
                I agree to the{" "}
                <Link href="/terms" target="_blank">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" target="_blank">Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn"
              style={{ marginTop: 8 }}
            >
              {loading ? "Confirming..." : "Confirm!"}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.72rem' }}>
            <span style={{ color: '#7e7e7e' }}>Already have an account? </span>
            <Link href="/login" style={{ color: '#B563FF', fontWeight: 600, textDecoration: 'underline' }}>
              Log in
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
