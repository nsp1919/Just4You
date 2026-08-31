"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import CustomerAuthShell from "@/components/auth/CustomerAuthShell";

export default function LoginPage() {
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("email") ?? "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const destinationAfterLogin = () => {
    const requestedPath = new URLSearchParams(window.location.search).get("next");
    return requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/dashboard";
  };

  useEffect(() => {
    if (!authLoading && user) router.replace(destinationAfterLogin());
  }, [authLoading, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace(destinationAfterLogin());
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

  if (authLoading || user) return null;

  return (
    <>
      <style>{`
        .auth-page,
        .auth-page *,
        .auth-page::before,
        .auth-page::after {
          animation: none !important;
          transition: none !important;
          scroll-behavior: auto !important;
        }

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

      <CustomerAuthShell
        eyebrow="Welcome back"
        title="Sign in to your celebrations"
        description="Continue a website, check your wishes, or create a new surprise from your dashboard."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p role="alert" className="flex items-center gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200"><AlertCircle size={16} />{error}</p>}

          <label className="block text-sm font-semibold text-white/65">
            Email address
            <span className="relative mt-2 block">
              <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-white outline-none focus:border-[#ff9e4f]/60" />
            </span>
          </label>

          <label className="block text-sm font-semibold text-white/65">
            Password
            <span className="relative mt-2 block">
              <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type={showPassword ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-12 text-white outline-none focus:border-[#ff9e4f]/60" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-white/35 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </span>
          </label>

          <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ffb877] via-[#ff8a5c] to-[#ff5f93] px-5 font-bold text-[#27131b] disabled:opacity-50">
            {loading ? "Signing in..." : <><span>Sign In</span><ArrowRight size={17} /></>}
          </button>
        </form>

        <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-white/40">
          <span>New to Just4You?</span>
          <Link href="/register" className="font-bold text-[#ffb877] hover:text-[#ffd1a8]">Create an account</Link>
        </div>
      </CustomerAuthShell>
    </>
  );
}
