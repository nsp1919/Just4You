"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { browserSessionPersistence, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Eye, EyeOff, KeyRound, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function AdminAccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await setPersistence(auth, browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const result = await response.json();
      if (!response.ok) {
        await signOut(auth);
        throw new Error(result.error ?? "Admin access denied.");
      }
      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      const code = typeof loginError === "object" && loginError && "code" in loginError ? String(loginError.code) : "";
      setError(code === "auth/invalid-credential" ? "Invalid Admin email or password." : loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#090d12] px-5 py-10 text-white lg:grid-cols-[minmax(320px,0.8fr)_minmax(520px,1.2fr)] lg:p-0">
      <section className="hidden border-r border-white/10 bg-[#0d131b] p-12 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="inline-flex items-center gap-3 font-playfair text-xl font-bold"><span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-300 text-[#07120d]"><ShieldCheck size={21} /></span>Just4You Operations</Link>
        <div><p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Restricted workspace</p><h1 className="font-playfair text-5xl font-semibold leading-tight">Customer, order, and payout controls belong behind a stronger door.</h1><p className="mt-6 max-w-lg leading-7 text-white/45">This portal uses a short-lived HTTP-only Admin session in addition to Firebase authentication. Access attempts and successful sign-ins are validated server-side.</p></div>
        <p className="text-xs text-white/30">Authorized Novantix Technologies personnel only.</p>
      </section>

      <section className="flex items-center justify-center py-10 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><span className="inline-flex items-center gap-2 font-playfair text-xl font-bold"><ShieldCheck className="text-emerald-300" /> Just4You Operations</span></div>
          <div className="mb-8"><span className="mb-5 grid h-12 w-12 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-300"><LockKeyhole size={22} /></span><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Admin access</p><h2 className="mt-2 font-playfair text-4xl font-semibold">Sign in to Control Center</h2><p className="mt-3 leading-6 text-white/45">Use the authorized Admin account. Customer accounts cannot enter this area.</p></div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-semibold text-white/65">Admin email<div className="relative mt-2"><Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" /><input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-white outline-none transition-colors focus:border-emerald-300/60" /></div></label>
            <label className="block text-sm font-semibold text-white/65">Password<div className="relative mt-2"><KeyRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" /><input type={showPassword ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-12 text-white outline-none transition-colors focus:border-emerald-300/60" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center text-white/35 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">{error}</p>}
            <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-300 px-5 font-bold text-[#07120d] transition-colors hover:bg-emerald-200 disabled:opacity-50">{loading ? <Loader2 size={17} className="animate-spin" /> : <LockKeyhole size={17} />}{loading ? "Verifying access..." : "Enter Control Center"}</button>
          </form>
          <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-white/35"><span>Session expires after 8 hours</span><Link href="/" className="font-semibold text-white/55 hover:text-white">Return to website</Link></div>
        </div>
      </section>
    </main>
  );
}