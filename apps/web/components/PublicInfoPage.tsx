import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ExternalLink,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
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
  highlights?: Array<{
    icon: ReactNode;
    label: string;
    value: string;
  }>;
  children: ReactNode;
}

interface InfoSectionProps {
  title: string;
  children: ReactNode;
}

export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <section className="border-b border-[#eadfd9] pb-10 last:border-b-0 last:pb-0">
      <h2 className="font-playfair text-[1.65rem] font-bold leading-tight text-[#241728] sm:text-3xl 2xl:text-[2rem]">{title}</h2>
      <div className="mt-4 max-w-5xl space-y-4 text-[0.98rem] leading-7 text-[#615866] 2xl:text-[1.05rem] 2xl:leading-8 [&_a]:font-bold [&_a]:text-[#b44552] [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:pl-1.5 [&_strong]:font-bold [&_strong]:text-[#332638] [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2.5">
        {children}
      </div>
    </section>
  );
}

export function PublicSiteHeader() {
  return (
    <header className="border-b border-white/10 bg-[#18101e] text-white">
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-6 px-5 sm:px-8 2xl:px-10">
        <Link href="/" className="inline-flex items-center gap-3 text-[#fff8f2]">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[#f06f61] shadow-[0_8px_24px_rgba(240,111,97,0.25)]">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <span className="font-playfair text-[1.35rem] font-bold">Just4You<span className="text-[#ffc979]">.buzz</span></span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-[#fff8f2] transition-colors hover:border-[#ffc979]/60 hover:text-[#ffc979]">
          <ArrowLeft size={15} aria-hidden="true" /> <span className="hidden sm:inline">Back to home</span><span className="sm:hidden">Home</span>
        </Link>
      </div>
      <nav aria-label="Company and policy pages" className="border-t border-white/10 bg-[#150d1b]">
        <div className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-3 sm:px-6 2xl:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-md px-3.5 py-3 text-sm font-semibold text-[#cdbfce] transition-colors hover:text-[#ffc979]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export function PublicSiteFooter() {
  return (
    <footer className="border-t-4 border-[#f06f61] bg-[#18101e] text-white">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_0.8fr_1fr] 2xl:px-10">
        <div>
          <p className="font-playfair text-2xl font-bold text-[#fff8f2]">Just4You<span className="text-[#ffc979]">.buzz</span></p>
          <p className="mt-4 max-w-md text-sm font-medium leading-7 text-[#cdbfce]">
            Just4You is a product of{" "}
            <a className="font-bold text-[#ffc979] hover:underline" href={BUSINESS.companyUrl} target="_blank" rel="noreferrer">Novantix Technologies</a>.
            {" "}Payments are processed and invoices are issued by Novantix Technologies.
          </p>
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#ffc979]">Customer support</p>
          <div className="mt-4 space-y-3 text-sm text-[#cdbfce]">
            <a href={`mailto:${BUSINESS.email}`} className="flex items-center gap-2.5 transition-colors hover:text-white"><Mail size={15} /> {BUSINESS.email}</a>
            <a href={BUSINESS.phoneHref} className="flex items-center gap-2.5 transition-colors hover:text-white"><Phone size={15} /> {BUSINESS.phoneDisplay}</a>
            <span className="flex items-center gap-2.5"><MapPin size={15} /> {BUSINESS.location}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#ffc979]">Company & policies</p>
          <nav aria-label="Footer policy links" className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm text-[#cdbfce]">
            {PUBLIC_LINKS.map((link) => <Link key={link.href} href={link.href} className="transition-colors hover:text-white">{link.label}</Link>)}
          </nav>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-5 py-5 text-xs leading-5 text-[#8e818f] sm:px-8 md:flex-row md:items-center md:justify-between 2xl:px-10">
          <p>© 2026 {BUSINESS.legalName}. All rights reserved.</p>
          <p>{OWNERSHIP_DISCLOSURE} CIN: {BUSINESS.cin}.</p>
        </div>
      </div>
    </footer>
  );
}

export default function PublicInfoPage({
  eyebrow,
  title,
  description,
  highlights,
  children,
}: PublicInfoPageProps) {
  return (
    <main className="min-h-screen bg-[#fffaf7] text-[#241728]">
      <PublicSiteHeader />

      <section className="relative overflow-hidden bg-[#18101e] text-white">
        <div
          className="absolute inset-0 opacity-40"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,201,121,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,201,121,0.055) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to right, black, transparent 85%)",
          }}
        />
        <div className="relative mx-auto max-w-[1600px] px-5 py-16 sm:px-8 sm:py-20 lg:py-24 2xl:px-10">
          <div className="max-w-5xl">
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#ffc979]">
              <span className="h-px w-8 bg-[#f06f61]" aria-hidden="true" /> {eyebrow}
            </p>
            <h1 className="mt-5 max-w-5xl font-playfair text-4xl font-bold leading-[1.05] text-[#fff8f2] sm:text-5xl lg:text-[3.5rem] 2xl:text-6xl">{title}</h1>
            <p className="mt-6 max-w-4xl text-base leading-8 text-[#cdbfce] sm:text-lg 2xl:text-xl 2xl:leading-9">{description}</p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#a99baa]">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-[#ffc979]" /> Operated by a registered Indian company</span>
              <span className="inline-flex items-center gap-2"><CalendarDays size={16} className="text-[#ffc979]" /> Updated {BUSINESS.policyUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {highlights && highlights.length > 0 && (
        <section className="border-b border-[#eadfd9] bg-[#fff1eb]">
          <div className="mx-auto grid max-w-[1600px] divide-y divide-[#e6cfc7] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 2xl:px-10">
            {highlights.map((highlight) => (
              <div key={highlight.label} className="flex items-start gap-4 py-6 md:px-7 md:first:pl-0 md:last:pr-0">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f06f61] text-white shadow-[0_8px_20px_rgba(180,69,82,0.16)]">
                  {highlight.icon}
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.11em] text-[#a54a55]">{highlight.label}</p>
                  <p className="mt-1 font-playfair text-lg font-bold leading-snug text-[#332638]">{highlight.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-20 lg:py-20 2xl:grid-cols-[320px_minmax(0,1fr)] 2xl:gap-24 2xl:px-10">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-lg border border-[#ecd9d2] bg-[#fff1eb] p-6">
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.13em] text-[#b44552]">
              <ShieldCheck size={16} /> Verified operator
            </p>
            <p className="mt-4 font-playfair text-xl font-bold leading-snug text-[#241728]">{BUSINESS.legalName}</p>
            <dl className="mt-5 space-y-4 border-t border-[#e7d0c8] pt-5 text-sm leading-6 text-[#6d606c]">
              <div className="flex gap-3">
                <Building2 size={17} className="mt-1 shrink-0 text-[#b44552]" aria-hidden="true" />
                <div><dt className="font-bold text-[#443647]">Corporate identity</dt><dd className="break-all">{BUSINESS.cin}</dd></div>
              </div>
              <div className="flex gap-3">
                <MapPin size={17} className="mt-1 shrink-0 text-[#b44552]" aria-hidden="true" />
                <div><dt className="font-bold text-[#443647]">Business location</dt><dd>{BUSINESS.location}</dd></div>
              </div>
              <div className="flex gap-3">
                <IndianRupee size={17} className="mt-1 shrink-0 text-[#b44552]" aria-hidden="true" />
                <div><dt className="font-bold text-[#443647]">Transaction currency</dt><dd>{BUSINESS.currency}</dd></div>
              </div>
            </dl>
            <a href={BUSINESS.companyUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#b44552] hover:underline">
              Verify on novantixtech.com <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
          <nav aria-label="Business and policy pages" className="mt-7 grid grid-cols-2 gap-2 text-sm lg:grid-cols-1">
            {PUBLIC_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 font-semibold text-[#6d606c] transition-colors hover:bg-[#f7e7e1] hover:text-[#b44552]">
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 max-w-5xl space-y-10 lg:pt-1 2xl:space-y-12">{children}</article>
      </div>

      <PublicSiteFooter />
    </main>
  );
}