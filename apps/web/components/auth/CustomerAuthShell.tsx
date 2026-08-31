import type { ReactNode } from "react";
import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";

interface CustomerAuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function CustomerAuthShell({ eyebrow, title, description, children }: CustomerAuthShellProps) {
  return (
    <main className="customer-auth-page grid min-h-screen bg-[#100a15] text-white lg:grid-cols-[minmax(360px,0.9fr)_minmax(520px,1.1fr)]">
      <style>{`
        .customer-auth-page,
        .customer-auth-page *,
        .customer-auth-page::before,
        .customer-auth-page::after {
          animation: none !important;
          transition: none !important;
          scroll-behavior: auto !important;
        }
      `}</style>

      <section className="hidden border-r border-white/[0.08] bg-[#1b1122] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <Link href="/" className="inline-flex items-center gap-3 font-playfair text-xl font-bold text-[#fff5ec]">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-[#ff8a5c] to-[#ff5f93] text-white">
            <Sparkles size={20} />
          </span>
          Just4You<span className="text-[#ffb877]">.buzz</span>
        </Link>

        <div className="max-w-xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#ff9e4f]">Your celebration space</p>
          <h1 className="font-playfair text-5xl font-semibold leading-[1.12] text-[#fff5ec] xl:text-6xl">
            Keep every meaningful moment in one beautiful place.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/50">
            Return to your celebrations, continue a draft, or begin something thoughtful for the people who matter.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-white/55">
            {["Birthdays", "Weddings", "Anniversaries", "Proposals"].map((occasion) => (
              <span key={occasion} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5">{occasion}</span>
            ))}
          </div>
        </div>

        <p className="flex items-center gap-2 text-xs text-white/30"><Heart size={14} className="text-[#ff6f9c]" /> Made for personal moments by Novantix Technologies.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:p-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex items-center gap-2.5 font-playfair text-xl font-bold text-[#fff5ec] lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[#ff8a5c] to-[#ff5f93] text-white"><Sparkles size={18} /></span>
            Just4You<span className="text-[#ffb877]">.buzz</span>
          </Link>

          <header className="mb-8">
            <span className="mb-5 grid h-12 w-12 place-items-center rounded-lg border border-[#ff9e4f]/20 bg-[#ff9e4f]/10 text-[#ffb877]"><Heart size={21} /></span>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff9e4f]">{eyebrow}</p>
            <h2 className="mt-2 font-playfair text-4xl font-semibold leading-tight text-[#fff5ec]">{title}</h2>
            <p className="mt-3 max-w-md leading-6 text-white/45">{description}</p>
          </header>

          {children}

          <div className="mt-7 border-t border-white/10 pt-5 text-right text-xs">
            <Link href="/" className="font-semibold text-white/45 hover:text-white">Return to website</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
