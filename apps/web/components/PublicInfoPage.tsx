import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Building2, ExternalLink, Mail, Phone, Sparkles } from "lucide-react";
import { BUSINESS, OWNERSHIP_DISCLOSURE } from "@/lib/business";

const PUBLIC_LINKS = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Refunds", href: "/refund-policy" },
  { label: "Delivery", href: "/delivery-policy" },
] as const;

interface PublicInfoPageProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

interface InfoSectionProps {
  title: string;
  children: ReactNode;
}

export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <section className="border-t border-white/10 pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-playfair text-2xl font-semibold text-[#fff5ec]">{title}</h2>
      <div className="mt-4 space-y-4 text-[0.95rem] leading-7 text-[#b9a6be] [&_a]:font-semibold [&_a]:text-[#ffb877] [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:pl-1 [&_strong]:text-[#efe1d6] [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}

export default function PublicInfoPage({
  eyebrow,
  title,
  description,
  children,
}: PublicInfoPageProps) {
  return (
    <main className="min-h-screen bg-[#0f0913] text-white">
      <header className="border-b border-white/10 bg-[#18101e]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-3 text-[#fff5ec]">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff8a5c] to-[#ff5f93]">
              <Sparkles size={16} aria-hidden="true" />
            </span>
            <span className="font-playfair text-xl font-bold">Just4You.buzz</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#b9a6be] transition-colors hover:text-[#fff5ec]">
            <ArrowLeft size={16} aria-hidden="true" /> Back to home
          </Link>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[#18101e]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffb877]">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-playfair text-4xl font-bold leading-tight text-[#fff5ec] sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#b9a6be] sm:text-lg">{description}</p>
          <p className="mt-5 text-sm text-[#8f8098]">Last updated: {BUSINESS.policyUpdated}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:py-16">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="border-l-2 border-[#ff8a5c] pl-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ffb877]">Operated by</p>
            <p className="mt-3 text-sm font-bold leading-6 text-[#fff5ec]">{BUSINESS.legalName}</p>
            <dl className="mt-4 space-y-3 text-sm leading-6 text-[#8f8098]">
              <div>
                <dt className="sr-only">Corporate Identity Number</dt>
                <dd>CIN: {BUSINESS.cin}</dd>
              </div>
              <div>
                <dt className="sr-only">Location</dt>
                <dd>{BUSINESS.location}</dd>
              </div>
              <div>
                <dt className="sr-only">Currency</dt>
                <dd>{BUSINESS.currency}</dd>
              </div>
            </dl>
          </div>
          <nav aria-label="Business and policy pages" className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 text-sm lg:grid-cols-1">
            {PUBLIC_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-[#8f8098] transition-colors hover:text-[#ffb877]">
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 space-y-10">{children}</article>
      </div>

      <footer className="border-t border-white/10 bg-[#0a0612]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <p className="max-w-4xl text-sm font-medium leading-7 text-[#b9a6be]">
            Just4You is a product of{" "}
            <a className="font-bold text-[#ffb877]" href={BUSINESS.companyUrl} target="_blank" rel="noreferrer">
              Novantix Technologies
            </a>
            . Payments are processed and invoices are issued by Novantix Technologies.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#8f8098]">
            <a href={`mailto:${BUSINESS.email}`} className="inline-flex items-center gap-2 hover:text-[#fff5ec]">
              <Mail size={15} aria-hidden="true" /> {BUSINESS.email}
            </a>
            <a href={BUSINESS.phoneHref} className="inline-flex items-center gap-2 hover:text-[#fff5ec]">
              <Phone size={15} aria-hidden="true" /> {BUSINESS.phoneDisplay}
            </a>
            <a href={BUSINESS.companyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[#fff5ec]">
              <Building2 size={15} aria-hidden="true" /> {BUSINESS.legalName} <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
          <p className="mt-7 text-xs leading-5 text-[#6a5d73]">
            {OWNERSHIP_DISCLOSURE} CIN: {BUSINESS.cin}. Business location: {BUSINESS.location}.
          </p>
        </div>
      </footer>
    </main>
  );
}