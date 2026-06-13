"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          background: #07070a;
          font-family: 'Space Grotesk', sans-serif;
          position: relative;
          overflow: hidden;
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
          width: 340px;
          height: 420px;
          background: #18181b;
          padding: 47px;
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
          padding: 13px 18px;
          margin: 18px 0 0 0;
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
          top: -24px;
          display: block;
          margin-bottom: -10px;
          font-size: 1.3em;
          text-align: center;
        }

        .btn {
          background: linear-gradient(144deg, #af40ff, #5b42f3 50%, #00ddeb);
          color: #fff;
          padding: 14px !important;
          font-size: 0.9em;
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
          padding: 14px !important;
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
            padding: 3em 2em;
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
            Log In to <span className="ui">Just4You</span>
          </span>

          {error && (
            <div className="auth-error">
              <AlertCircle size={14} />
              <span style={{ marginLeft: 6 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
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
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={loading}
              className="btn"
              style={{ marginTop: 24 }}
            >
              {loading ? "Signing In..." : "Let's go!"}
            </button>
          </form>

          <div style={{ marginTop: 'auto', paddingTop: '20px', textAlign: 'center', fontSize: '0.72rem' }}>
            <span style={{ color: '#7e7e7e' }}>Don't have an account? </span>
            <Link href="/register" style={{ color: '#B563FF', fontWeight: 600, textDecoration: 'underline' }}>
              Sign up
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
