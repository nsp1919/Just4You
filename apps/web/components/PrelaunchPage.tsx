"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, ChevronDown, Heart, Mail, Phone, Send, Sparkles, User } from "lucide-react";
import { BUSINESS } from "@/lib/business";

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

  const launchDate = new Date(launchAt).toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  return (
    <main className="prelaunch-shell">
      <Image
        src="/wedding-demo/couple.jpg"
        alt="A couple celebrating together"
        fill
        priority
        sizes="100vw"
        className="prelaunch-photo"
      />
      <div className="prelaunch-wash" />
      <div className="prelaunch-grain" aria-hidden="true" />

      <div className="sparkle-field" aria-hidden="true">
        <Sparkles className="sparkle sparkle-one" />
        <Sparkles className="sparkle sparkle-two" />
        <Sparkles className="sparkle sparkle-three" />
      </div>

      <div className="prelaunch-frame">
        <header className="prelaunch-header">
          <div className="brand-lockup">
            <span className="brand-mark"><Heart size={18} fill="currentColor" /></span>
            <span className="brand-name">Just4You<span>.buzz</span></span>
          </div>
          <p className="header-note">Personal celebrations, made unforgettable</p>
        </header>

        <section className="prelaunch-content">
          <div className="launch-story">
            <div className="opening-label">
              <CalendarClock size={15} /> Opening soon
            </div>
            <h1>Your moment deserves<br />a little <em>magic.</em></h1>
            <p className="launch-copy">
              We are putting the finishing touches on a new way to turn your memories into a celebration they can open, play, and keep.
            </p>

            <div className="launch-date">
              <span>We go live</span>
              <strong>{launchDate}</strong>
            </div>

            <div className="countdown" aria-label="Time remaining until launch">
              {units.map(([label, value]) => (
                <div key={label} className="countdown-unit">
                  <div key={`${label}-${value}`} suppressHydrationWarning className="countdown-value">
                    {String(value).padStart(2, "0")}
                  </div>
                  <div className="countdown-label">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="reservation-panel">
            {status === "success" ? (
              <div className="success-state" role="status">
                <span className="success-icon"><CheckCircle2 size={34} /></span>
                <p className="panel-kicker">Your place is reserved</p>
                <h2>We will make it personal.</h2>
                <p>Our team will contact you to confirm the details. No payment has been taken.</p>
              </div>
            ) : (
              <form onSubmit={submitPrebook}>
                <div className="panel-heading">
                  <p className="panel-kicker">Be first in line</p>
                  <h2>Reserve your celebration</h2>
                  <p>Tell us the occasion. We will take care of the surprise.</p>
                </div>

                <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                <div className="field-grid">
                  <label className="field">
                    <span>Your name</span>
                    <User size={16} />
                    <input required minLength={2} name="name" autoComplete="name" placeholder="e.g. Priya Sharma" />
                  </label>
                  <label className="field">
                    <span>Email address</span>
                    <Mail size={16} />
                    <input required type="email" name="email" autoComplete="email" placeholder="you@example.com" />
                  </label>
                  <label className="field">
                    <span>Phone number</span>
                    <Phone size={16} />
                    <input required minLength={7} name="phone" autoComplete="tel" inputMode="tel" placeholder="Your contact number" />
                  </label>
                  <label className="field field-select">
                    <span>Occasion</span>
                    <Sparkles size={16} />
                    <select required name="occasion" defaultValue="" aria-label="Occasion">
                      <option value="" disabled>Choose an occasion</option>
                      <option>Birthday</option>
                      <option>Wedding</option>
                      <option>Anniversary</option>
                      <option>Proposal</option>
                      <option>Kids birthday</option>
                      <option>Custom celebration</option>
                    </select>
                    <ChevronDown className="select-chevron" size={16} />
                  </label>
                </div>

                <label className="field message-field">
                  <span>Your idea <small>Optional</small></span>
                  <textarea name="message" maxLength={500} rows={2} placeholder="A few details about the person or the moment..." />
                </label>

                {error && <p className="form-error" role="alert">{error}</p>}

                <button disabled={status === "sending"} className="reserve-button">
                  <span>{status === "sending" ? "Reserving..." : "Reserve my celebration"}</span>
                  <Send size={17} />
                </button>
                <p className="privacy-note">No payment today. Your details stay private.</p>
              </form>
            )}
          </div>
        </section>

        <footer className="prelaunch-footer">
          <span>
            Just4You is a product of <a href={BUSINESS.companyUrl} target="_blank" rel="noreferrer">Novantix Technologies</a>. Payments are
            processed and invoices are issued by Novantix Technologies.
          </span>
          <nav className="prelaunch-policy-links" aria-label="Company and policy pages">
            <Link href="/about">About</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/refund-policy">Refunds</Link>
            <Link href="/delivery-policy">Delivery</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <a href={`mailto:${BUSINESS.email}`}>Questions? {BUSINESS.email}</a>
        </footer>
      </div>

      <style jsx>{`
        .prelaunch-shell {
          --ink: #100b13;
          --cream: #fff7ef;
          --muted: #d8c8d2;
          --coral: #ff755f;
          --gold: #f3c66e;
          position: relative;
          min-height: 100svh;
          overflow: hidden;
          color: var(--cream);
          background: var(--ink);
          font-family: var(--font-inter), sans-serif;
        }

        .prelaunch-photo {
          object-fit: cover;
          object-position: 64% center;
          animation: photo-drift 22s ease-in-out infinite alternate;
        }

        .prelaunch-wash {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(16, 11, 19, 0.98) 0%, rgba(16, 11, 19, 0.9) 37%, rgba(16, 11, 19, 0.48) 68%, rgba(16, 11, 19, 0.66) 100%),
            linear-gradient(180deg, rgba(16, 11, 19, 0.32), rgba(16, 11, 19, 0.72));
        }

        .prelaunch-grain {
          position: absolute;
          inset: 0;
          opacity: 0.2;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        .prelaunch-frame {
          position: relative;
          z-index: 2;
          display: flex;
          width: min(100%, 1440px);
          min-height: 100svh;
          margin: 0 auto;
          padding: 24px 56px 18px;
          flex-direction: column;
        }

        .prelaunch-header,
        .prelaunch-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .prelaunch-header {
          min-height: 46px;
          animation: reveal-down 0.7s 0.05s both;
        }

        .brand-lockup {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .brand-mark {
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 8px;
          color: white;
          background: var(--coral);
          box-shadow: 0 12px 32px rgba(255, 117, 95, 0.28);
          transform: rotate(-4deg);
        }

        .brand-name {
          font-size: 17px;
          font-weight: 800;
        }

        .brand-name span { color: var(--gold); }

        .header-note,
        .prelaunch-footer {
          color: rgba(255, 247, 239, 0.62);
          font-size: 11px;
        }

        .prelaunch-footer a {
          color: var(--gold);
          font-weight: 700;
          text-decoration: none;
        }

        .prelaunch-footer > span:first-child {
          flex-basis: 100%;
        }

        .prelaunch-policy-links {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 16px;
        }

        .header-note {
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .prelaunch-content {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(440px, 0.78fr);
          align-items: center;
          flex: 1;
          gap: clamp(48px, 7vw, 108px);
          padding: 38px 0 30px;
        }

        .launch-story {
          max-width: 650px;
          animation: reveal-up 0.85s 0.12s both;
        }

        .opening-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 22px;
          color: var(--gold);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .opening-label::before {
          width: 34px;
          height: 1px;
          content: "";
          background: var(--gold);
        }

        h1 {
          max-width: 650px;
          margin: 0;
          color: var(--cream);
          font-family: var(--font-playfair), serif;
          font-size: clamp(48px, 5.15vw, 76px);
          font-weight: 600;
          line-height: 0.98;
          letter-spacing: 0;
          text-wrap: balance;
        }

        h1 em {
          color: var(--coral);
          font-weight: 600;
        }

        .launch-copy {
          max-width: 570px;
          margin: 24px 0 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.75;
        }

        .launch-date {
          display: flex;
          margin-top: 28px;
          align-items: center;
          gap: 14px;
          color: var(--cream);
          font-size: 13px;
        }

        .launch-date span {
          color: rgba(255, 247, 239, 0.55);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 10px;
          font-weight: 800;
        }

        .launch-date strong { font-weight: 600; }

        .countdown {
          display: grid;
          max-width: 560px;
          margin-top: 26px;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(255, 255, 255, 0.16);
          border-bottom: 1px solid rgba(255, 255, 255, 0.16);
        }

        .countdown-unit {
          position: relative;
          padding: 17px 12px 15px;
          text-align: center;
        }

        .countdown-unit + .countdown-unit::before {
          position: absolute;
          top: 20%;
          bottom: 20%;
          left: 0;
          width: 1px;
          content: "";
          background: rgba(255, 255, 255, 0.13);
        }

        .countdown-value {
          font-family: var(--font-playfair), serif;
          font-size: 34px;
          font-weight: 700;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          animation: digit-in 0.38s ease-out both;
        }

        .countdown-label {
          margin-top: 6px;
          color: var(--gold);
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .reservation-panel {
          width: 100%;
          max-width: 520px;
          justify-self: end;
          padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 8px;
          background: rgba(22, 14, 25, 0.82);
          box-shadow: 0 30px 80px rgba(4, 2, 5, 0.34);
          backdrop-filter: blur(18px);
          animation: panel-in 0.9s 0.22s both;
        }

        .panel-heading { margin-bottom: 22px; }

        .panel-kicker {
          margin: 0 0 7px;
          color: var(--gold) !important;
          font-size: 10px !important;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .panel-heading h2,
        .success-state h2 {
          margin: 0;
          font-family: var(--font-playfair), serif;
          font-size: 30px;
          font-weight: 600;
          line-height: 1.1;
        }

        .panel-heading > p:last-child,
        .success-state > p:last-child {
          margin: 8px 0 0;
          color: rgba(255, 247, 239, 0.62);
          font-size: 12px;
          line-height: 1.55;
        }

        .field-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
        }

        .field {
          position: relative;
          display: block;
        }

        .field > span {
          display: block;
          margin: 0 0 6px;
          color: rgba(255, 247, 239, 0.72);
          font-size: 10px;
          font-weight: 700;
        }

        .field > svg:not(.select-chevron) {
          position: absolute;
          bottom: 14px;
          left: 13px;
          color: rgba(243, 198, 110, 0.72);
          pointer-events: none;
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          outline: none;
          color: var(--cream);
          background: rgba(4, 2, 6, 0.28);
          font: inherit;
          font-size: 12px;
          transition: border-color 180ms ease, background-color 180ms ease;
        }

        .field input,
        .field select {
          height: 44px;
          padding: 0 34px 0 39px;
        }

        .field select {
          appearance: none;
          cursor: pointer;
        }

        .field select option { background: #211622; }

        .field textarea {
          min-height: 64px;
          padding: 11px 13px;
          resize: vertical;
          line-height: 1.5;
        }

        .field input::placeholder,
        .field textarea::placeholder { color: rgba(216, 200, 210, 0.38); }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: rgba(243, 198, 110, 0.72);
          background: rgba(4, 2, 6, 0.5);
        }

        .select-chevron {
          position: absolute;
          right: 12px;
          bottom: 14px;
          color: rgba(255, 247, 239, 0.5);
          pointer-events: none;
        }

        .message-field { margin-top: 13px; }
        .message-field small { color: rgba(255, 247, 239, 0.36); font-weight: 500; }

        .reserve-button {
          display: flex;
          width: 100%;
          height: 48px;
          margin-top: 16px;
          padding: 0 18px;
          align-items: center;
          justify-content: space-between;
          border: 0;
          border-radius: 6px;
          color: white;
          background: var(--coral);
          box-shadow: 0 14px 28px rgba(255, 117, 95, 0.2);
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          transition: transform 180ms ease, background-color 180ms ease;
        }

        .reserve-button:hover:not(:disabled) {
          background: #ff876f;
          transform: translateY(-2px);
        }

        .reserve-button:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 3px;
        }

        .reserve-button:disabled { cursor: wait; opacity: 0.65; }

        .privacy-note {
          margin: 10px 0 0;
          color: rgba(255, 247, 239, 0.42);
          font-size: 9px;
          text-align: center;
        }

        .form-error {
          margin: 10px 0 0;
          color: #ffb4a9;
          font-size: 11px;
        }

        .success-state {
          display: flex;
          min-height: 390px;
          padding: 30px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .success-icon {
          display: grid;
          width: 62px;
          height: 62px;
          margin-bottom: 20px;
          place-items: center;
          border: 1px solid rgba(110, 231, 183, 0.35);
          border-radius: 50%;
          color: #6ee7b7;
          animation: success-pop 0.55s ease-out both;
        }

        .prelaunch-footer {
          min-height: 26px;
          gap: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 14px;
        }

        .sparkle {
          position: absolute;
          z-index: 1;
          color: var(--gold);
          filter: drop-shadow(0 0 8px rgba(243, 198, 110, 0.42));
          animation: sparkle-float 5s ease-in-out infinite;
        }

        .sparkle-one { top: 18%; left: 48%; width: 21px; animation-delay: -1s; }
        .sparkle-two { top: 72%; left: 54%; width: 14px; animation-delay: -3.2s; }
        .sparkle-three { top: 12%; right: 7%; width: 13px; animation-delay: -2.1s; }

        @keyframes photo-drift {
          from { transform: scale(1.02) translate3d(0, 0, 0); }
          to { transform: scale(1.08) translate3d(-1.2%, -0.7%, 0); }
        }

        @keyframes reveal-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes reveal-down {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes panel-in {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes digit-in {
          from { opacity: 0.25; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes sparkle-float {
          0%, 100% { opacity: 0.25; transform: translateY(0) rotate(0); }
          50% { opacity: 0.9; transform: translateY(-10px) rotate(12deg); }
        }

        @keyframes success-pop {
          from { opacity: 0; transform: scale(0.72); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 1000px) {
          .prelaunch-frame { padding: 22px 30px 18px; }
          .prelaunch-content { grid-template-columns: minmax(0, 1fr) minmax(400px, 0.9fr); gap: 34px; }
          h1 { font-size: 48px; }
          .reservation-panel { padding: 24px; }
        }

        @media (max-width: 820px) {
          .prelaunch-shell { overflow-y: auto; }
          .prelaunch-photo { position: fixed !important; object-position: 62% center; }
          .prelaunch-wash { position: fixed; background: linear-gradient(180deg, rgba(16, 11, 19, 0.66), rgba(16, 11, 19, 0.96) 42%, #100b13 100%); }
          .prelaunch-grain { position: fixed; }
          .prelaunch-frame { min-height: 100svh; padding: 20px; }
          .prelaunch-content { grid-template-columns: 1fr; gap: 34px; padding: 56px 0 32px; }
          .launch-story { max-width: 620px; }
          .reservation-panel { max-width: 620px; justify-self: start; }
          .sparkle-one { left: auto; right: 16%; }
          .prelaunch-footer { flex-direction: column; align-items: flex-start; gap: 6px; }
        }

        @media (max-width: 560px) {
          .prelaunch-frame { padding: 16px; }
          .header-note { display: none; }
          .prelaunch-content { padding-top: 44px; }
          .opening-label { margin-bottom: 16px; }
          h1 { font-size: 42px; line-height: 1.02; }
          .launch-copy { margin-top: 18px; font-size: 13px; }
          .launch-date { align-items: flex-start; flex-direction: column; gap: 5px; }
          .countdown { margin-top: 22px; }
          .countdown-unit { padding: 14px 4px 13px; }
          .countdown-value { font-size: 28px; }
          .reservation-panel { padding: 22px 18px; }
          .panel-heading h2, .success-state h2 { font-size: 27px; }
          .field-grid { grid-template-columns: 1fr; }
          .success-state { min-height: 330px; padding: 20px 4px; }
          .prelaunch-footer { font-size: 11px; line-height: 1.6; gap: 8px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .prelaunch-photo,
          .prelaunch-header,
          .launch-story,
          .reservation-panel,
          .countdown-value,
          .sparkle,
          .success-icon {
            animation: none;
          }
          .reserve-button { transition: none; }
        }
      `}</style>
    </main>
  );
}