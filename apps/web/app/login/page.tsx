"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.code === "auth/invalid-credential"
        ? "Invalid email or password."
        : err.message ?? "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch {
      setError("Google login failed. Please try again.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-deep)" }}>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-3xl">✨</span>
          <span className="text-2xl font-bold gradient-text">Just4You</span>
        </Link>

        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold font-playfair mb-1 text-center">Welcome back</h1>
          <p className="text-[var(--text-muted)] text-sm text-center mb-8">Sign in to your account</p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl mb-6 transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/20" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-[var(--text-muted)]" style={{ background: "var(--bg-card)" }}>or sign in with email</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm text-red-400"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="input-field pl-11"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="login-password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="input-field pl-11 pr-11"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">Create one free</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
