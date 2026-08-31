"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, ArrowRight, Eye, EyeOff, Gift, Lock, Mail, UserRound } from "lucide-react";
import { captureReferralFromUrl, clearStoredReferral, getStoredReferral } from "@/lib/referral";
import { useReferralRewards } from "@/lib/use-referral-rewards";
import CustomerAuthShell from "@/components/auth/CustomerAuthShell";

export default function RegisterPage() {
  const { register } = useAuth();
  const { joinBonusInr } = useReferralRewards();
  const router = useRouter();
  const [name, setName] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("name") ?? "";
  });
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("email") ?? "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referral, setReferral] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      captureReferralFromUrl();
      const storedReferral = getStoredReferral();
      if (storedReferral) {
        fetch(`/api/user/profile?code=${encodeURIComponent(storedReferral)}`)
          .then((response) => response.json())
          .then(({ valid }) => {
            if (valid) setReferral(storedReferral);
            else clearStoredReferral();
          })
          .catch(() => clearStoredReferral());
      }
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
          background: radial-gradient(120% 120% at 50% 0%, #201430 0%, #18101e 45%, #0f0913 100%);
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
            linear-gradient(rgba(255, 224, 196, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 224, 196, 0.025) 1px, transparent 1px);
          background-size: 64px 64px;
          -webkit-mask-image: radial-gradient(circle at 50% 40%, #000 0%, transparent 75%);
          mask-image: radial-gradient(circle at 50% 40%, #000 0%, transparent 75%);
          pointer-events: none;
        }

        /* Ambient Orbs */
        .auth-page::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255,138,92,0.12), transparent 70%);
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
          background: linear-gradient(180deg, rgba(38,24,48,0.92), rgba(24,16,30,0.92));
          -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
          padding: 40px 36px;
          color: #fff5ec;
          border-radius: 22px;
          border: 1px solid rgba(255,224,196,0.12);
          box-shadow: 0 30px 70px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04);
          font-size: 1.2rem;
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
          animation: cardIn 0.6s cubic-bezier(0.19, 1, 0.22, 1);
        }

        @keyframes cardIn {
          0% { opacity: 0; transform: translateY(24px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .login input[type="text"],
        .login input[type="email"],
        .login input[type="password"] {
          opacity: 1;
          display: block;
          border: 1px solid rgba(255,224,196,0.1);
          outline: none;
          width: 100%;
          padding: 13px 18px;
          margin: 14px 0 0 0;
          font-size: 0.8em;
          border-radius: 14px;
          background: rgba(255,240,228,0.04);
          color: #fff5ec;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }

        .login input::placeholder {
          color: #8f8098;
          opacity: 1;
        }

        .login input[type="text"]:focus,
        .login input[type="email"]:focus,
        .login input[type="password"]:focus {
          border-color: rgba(255,138,92,0.55);
          background: rgba(255,240,228,0.06);
          box-shadow: 0 0 0 4px rgba(255,111,156,0.12);
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
        }

        .h1 {
          padding: 0;
          position: relative;
          top: -16px;
          display: block;
          margin-bottom: -4px;
          font-size: 1.3em;
          text-align: center;
          font-family: var(--font-playfair), Georgia, serif;
        }

        .btn {
          background: linear-gradient(135deg, #ffb877, #ff8a5c 45%, #ff5f93);
          background-size: 160% 160%;
          color: #2a1512;
          padding: 13px !important;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 14px 30px -10px rgba(255,95,147,0.55);
          transition: transform 0.18s ease, box-shadow 0.25s ease, background-position 0.5s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
        }

        .btn:hover:not(:disabled) {
          background-position: 100% 50%;
          transform: translateY(-2px);
          box-shadow: 0 18px 38px -10px rgba(255,95,147,0.7);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ui {
          font-weight: bolder;
          background: linear-gradient(90deg, #ff9e4f, #ff6f9c);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
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
          color: #ff9e4f;
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

      `}</style>

      <CustomerAuthShell
        eyebrow="Create an account"
        title="Start your celebration space"
        description="Create an account to save your work, manage every surprise, and share it when the moment is right."
      >
        {referral && <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-400/25 bg-green-400/[0.08] px-4 py-3 text-sm text-green-300"><Gift size={17} className="mt-0.5 shrink-0" /><span>A friend invited you. <strong>{`₹${joinBonusInr}`}</strong> will be added to your wallet.</span></div>}
        {error && <p role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200"><AlertCircle size={16} />{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-white/65">
            Your name
            <span className="relative mt-2 block"><UserRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" /><input type="text" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-white outline-none focus:border-[#ff9e4f]/60" /></span>
          </label>

          <label className="block text-sm font-semibold text-white/65">
            Email address
            <span className="relative mt-2 block"><Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" /><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-white outline-none focus:border-[#ff9e4f]/60" /></span>
          </label>

          <label className="block text-sm font-semibold text-white/65">
            Password
            <span className="relative mt-2 block"><Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" /><input type={showPassword ? "text" : "password"} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-12 text-white outline-none focus:border-[#ff9e4f]/60" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-white/35 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
          </label>

          {password.length > 0 && <div className="flex items-center gap-3" aria-label={`Password strength: ${strengthLabel[strength]}`}><div className="grid flex-1 grid-cols-4 gap-1">{[1, 2, 3, 4].map((level) => <span key={level} className="h-1 rounded-full" style={{ background: level <= strength ? strengthColor[strength] : "rgba(255,255,255,0.08)" }} />)}</div><span className="text-xs font-semibold" style={{ color: strengthColor[strength] }}>{strengthLabel[strength]}</span></div>}

          <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-white/45">
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#ff8a5c]" />
            <span>I agree to the <Link href="/terms" target="_blank" className="font-semibold text-[#ffb877]">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="font-semibold text-[#ffb877]">Privacy Policy</Link>.</span>
          </label>

          <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ffb877] via-[#ff8a5c] to-[#ff5f93] px-5 font-bold text-[#27131b] disabled:opacity-50">
            {loading ? "Creating account..." : <><span>Create Account</span><ArrowRight size={17} /></>}
          </button>
        </form>

        <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-white/40">
          <span>Already have an account?</span>
          <Link href="/login" className="font-bold text-[#ffb877] hover:text-[#ffd1a8]">Sign in</Link>
        </div>
      </CustomerAuthShell>
    </>
  );
}
