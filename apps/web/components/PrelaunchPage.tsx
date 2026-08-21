"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Mail, Phone, Send, Sparkles } from "lucide-react";

interface Props {
  launchAt: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(launchAt: string): TimeLeft {
  const remaining = Math.max(0, new Date(launchAt).getTime() - Date.now());
  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  };
}

export default function PrelaunchPage({ launchAt }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(launchAt));
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = getTimeLeft(launchAt);
      setTimeLeft(next);
      if (next.days + next.hours + next.minutes + next.seconds === 0) window.location.reload();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [launchAt]);

  const submitPrebook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/prebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to place your prebook");
      form.reset();
      setStatus("success");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to place your prebook");
      setStatus("error");
    }
  };

  const units: Array<[string, number]> = [
    ["Days", timeLeft.days],
    ["Hours", timeLeft.hours],
    ["Minutes", timeLeft.minutes],
    ["Seconds", timeLeft.seconds],
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#100b15] text-[#fff5ec]">
      <Image src="/wedding-demo/couple.jpg" alt="A Just4You celebration website preview" fill priority className="object-cover object-center" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,11,21,0.62),rgba(16,11,21,0.96)_72%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#ff7f62] text-white shadow-lg shadow-[#ff5f93]/20">
            <Sparkles size={17} />
          </span>
          <span className="font-bold text-lg">Just4You<span className="text-[#ffcf7a]">.buzz</span></span>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ffcf7a]/30 bg-black/30 px-4 py-2 text-xs font-semibold uppercase text-[#ffcf7a] backdrop-blur-md">
            <CalendarClock size={14} /> Opening soon
          </div>
          <h1 className="max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">
            Beautiful surprises are<br className="hidden sm:block" /> almost ready.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#d7c6d8] sm:text-base">
            Personalized celebration websites are launching on {new Date(launchAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}.
          </p>

          <div className="mt-9 grid w-full max-w-2xl grid-cols-4 gap-2 sm:gap-4" aria-label="Time remaining until launch">
            {units.map(([label, value]) => (
              <div key={label} className="border-y border-white/15 bg-black/25 px-1 py-4 backdrop-blur-sm sm:py-6">
                <div suppressHydrationWarning className="font-mono text-2xl font-bold tabular-nums text-white sm:text-4xl">
                  {String(value).padStart(2, "0")}
                </div>
                <div className="mt-2 text-[9px] font-bold uppercase text-[#ffcf7a] sm:text-xs">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 w-full max-w-3xl border-t border-white/15 pt-8">
            {status === "success" ? (
              <div className="mx-auto flex max-w-lg flex-col items-center py-8" role="status">
                <CheckCircle2 size={36} className="text-emerald-400" />
                <h2 className="mt-4 text-2xl font-bold">Prebook received</h2>
                <p className="mt-2 text-sm text-[#d7c6d8]">Our team will contact you to confirm the details. No payment was taken.</p>
              </div>
            ) : (
              <form onSubmit={submitPrebook} className="text-left">
                <div className="mb-5 text-center">
                  <h2 className="text-xl font-bold sm:text-2xl">Prebook your celebration website</h2>
                  <p className="mt-2 text-sm text-[#d7c6d8]">Reserve your order now. No payment is required today.</p>
                </div>
                <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="relative">
                    <span className="sr-only">Name</span>
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a996ad]" />
                    <input required minLength={2} name="name" placeholder="Your name" className="h-12 w-full rounded-md border border-white/15 bg-black/35 pl-11 pr-4 text-sm outline-none placeholder:text-[#89788f] focus:border-[#ff9e4f]" />
                  </label>
                  <label className="relative">
                    <span className="sr-only">Email</span>
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a996ad]" />
                    <input required type="email" name="email" placeholder="Email address" className="h-12 w-full rounded-md border border-white/15 bg-black/35 pl-11 pr-4 text-sm outline-none placeholder:text-[#89788f] focus:border-[#ff9e4f]" />
                  </label>
                  <label className="relative">
                    <span className="sr-only">Phone</span>
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a996ad]" />
                    <input required minLength={7} name="phone" inputMode="tel" placeholder="Phone number" className="h-12 w-full rounded-md border border-white/15 bg-black/35 pl-11 pr-4 text-sm outline-none placeholder:text-[#89788f] focus:border-[#ff9e4f]" />
                  </label>
                  <label>
                    <span className="sr-only">Occasion</span>
                    <select required name="occasion" defaultValue="" className="h-12 w-full rounded-md border border-white/15 bg-[#211827] px-4 text-sm text-[#fff5ec] outline-none focus:border-[#ff9e4f]">
                      <option value="" disabled>Choose occasion</option>
                      <option>Birthday</option><option>Wedding</option><option>Anniversary</option><option>Proposal</option><option>Kids birthday</option><option>Custom celebration</option>
                    </select>
                  </label>
                </div>
                <textarea name="message" maxLength={500} rows={3} placeholder="Tell us what you have in mind (optional)" className="mt-3 w-full resize-none rounded-md border border-white/15 bg-black/35 px-4 py-3 text-sm outline-none placeholder:text-[#89788f] focus:border-[#ff9e4f]" />
                {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
                <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <span className="text-xs text-[#a996ad]">Order details are sent to info@novantixtech.com</span>
                  <button disabled={status === "sending"} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#ff765f] px-7 text-sm font-bold text-white transition hover:bg-[#ff8d6f] disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                    <Send size={16} /> {status === "sending" ? "Sending..." : "Prebook now"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}