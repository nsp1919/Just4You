"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { BellRing, Check, Loader2 } from "lucide-react";

function ReminderForm() {
  const searchParams = useSearchParams();
  const [subscriberName, setSubscriberName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [email, setEmail] = useState("");
  const [occasionType, setOccasionType] = useState("birthday");
  const [occasionDate, setOccasionDate] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/occasion-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriberName, recipientName, email, occasionType, occasionDate, consent, website }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save this reminder.");
      setSaved(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this reminder.");
    } finally {
      setSubmitting(false);
    }
  };

  if (searchParams.get("unsubscribed") === "1") {
    return <Result title="Reminders stopped" message="You will no longer receive reminders for that saved occasion." />;
  }
  if (saved) return <Result title="Reminder saved" message={`Check ${email} for confirmation. We'll remind you 14, 7, and 2 days before the occasion.`} />;

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl border-y border-white/10 py-8 text-left">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name"><input required value={subscriberName} onChange={(event) => setSubscriberName(event.target.value)} placeholder="e.g. Nisha" className="reminder-input" /></Field>
        <Field label="Your email"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="reminder-input" /></Field>
        <Field label="Who is the occasion for?"><input required value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="e.g. Aarav" className="reminder-input" /></Field>
        <Field label="Occasion"><select value={occasionType} onChange={(event) => setOccasionType(event.target.value)} className="reminder-input"><option value="birthday">Birthday</option><option value="anniversary">Anniversary</option><option value="wedding">Wedding</option><option value="proposal">Special day</option><option value="graduation">Graduation</option><option value="other">Other</option></select></Field>
      </div>
      <Field label="Date"><input required type="date" value={occasionDate} onChange={(event) => setOccasionDate(event.target.value)} className="reminder-input" /></Field>
      <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-6 text-white/55"><input required type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#ff6f9c]" /><span>Email me reminders 14, 7, and 2 days before this occasion. I can unsubscribe from any email.</span></label>
      <label className="absolute -left-[10000px]" aria-hidden="true">Website<input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></label>
      {error && <p role="alert" className="mt-5 rounded-lg border border-rose-400/20 bg-rose-400/[0.08] p-3 text-sm text-rose-200">{error}</p>}
      <button type="submit" disabled={submitting || !consent} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff8a5c] to-[#ff5f93] px-6 font-bold disabled:cursor-not-allowed disabled:opacity-40">{submitting ? <Loader2 className="animate-spin" size={17} /> : <BellRing size={17} />} {submitting ? "Saving..." : "Save free reminders"}</button>
      <p className="mt-3 text-center text-xs text-white/30">No account or purchase required.</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mb-4 block text-sm font-semibold text-white/70">{label}{children}</label>;
}

function Result({ title, message }: { title: string; message: string }) {
  return <div className="mx-auto max-w-lg border-y border-white/10 py-12 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><Check size={26} /></span><h2 className="mt-5 font-playfair text-3xl font-bold">{title}</h2><p className="mt-3 leading-7 text-white/50">{message}</p><Link href="/" className="mt-6 inline-block font-semibold text-[#ffb877]">Return home</Link></div>;
}

export default function RemindersPage() {
  return (
    <main className="min-h-screen bg-[#130d19] px-5 py-14 text-white">
      <div className="mx-auto max-w-3xl text-center"><span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl bg-[#ff9e4f]/15 text-[#ffb877]"><BellRing size={22} /></span><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ffb877]">Free occasion reminders</p><h1 className="font-playfair text-4xl font-bold sm:text-5xl">Remember the date. Plan the feeling.</h1><p className="mx-auto mb-9 mt-4 max-w-xl leading-7 text-white/55">Save any birthday, anniversary, wedding, or special date. We&apos;ll email you early enough to make it meaningful.</p><Suspense fallback={<Loader2 className="mx-auto animate-spin" />}><ReminderForm /></Suspense></div>
      <style jsx global>{`.reminder-input{display:block;width:100%;margin-top:8px;border:1px solid rgba(255,255,255,.1);border-radius:8px;background:rgba(255,255,255,.05);padding:12px 14px;color:#fff;outline:none;font-weight:400}.reminder-input:focus{border-color:#ff9e4f}.reminder-input option{background:#1b1222}`}</style>
    </main>
  );
}