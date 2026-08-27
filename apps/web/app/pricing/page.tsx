"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, LockKeyhole, Plus, ShieldCheck, ShoppingCart, Zap } from "lucide-react";
import {
  BASE_PACKAGE,
  FEATURE_ADDONS,
  BUNDLES,
  HOSTING_FEATURE_IDS,
  computePriceInr,
  formatInr,
  type FeatureId,
} from "@/lib/constants";
import { saveCartFeatures } from "@/lib/cart";
import { trackEvent } from "@/lib/analytics";
import { BUSINESS } from "@/lib/business";
import { PublicSiteFooter, PublicSiteHeader } from "@/components/PublicInfoPage";

function sameSet(a: FeatureId[], b: FeatureId[]) {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

export default function PricingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<FeatureId[]>([]);

  const total = useMemo(() => computePriceInr(selected), [selected]);
  const activeBundle = useMemo(
    () => BUNDLES.find((b) => sameSet(b.addons, selected))?.id ?? null,
    [selected]
  );

  const toggle = (id: FeatureId) =>
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // Hosting tiers are mutually exclusive — adding one removes the other.
      const next = HOSTING_FEATURE_IDS.includes(id)
        ? prev.filter((x) => !HOSTING_FEATURE_IDS.includes(x))
        : prev;
      return [...next, id];
    });

  const applyBundle = (addons: FeatureId[]) => setSelected([...addons]);

  const startCreate = () => {
    saveCartFeatures(selected);
    trackEvent("cart_checkout_started", { features: selected.join(","), total });
    router.push("/dashboard/create");
  };

  return (
    <main className="min-h-screen bg-[#fffaf7] text-[#241728]">
      <PublicSiteHeader />

      <section className="relative overflow-hidden bg-[#18101e] text-white">
        <div className="absolute inset-0 opacity-40" aria-hidden="true" style={{
          backgroundImage: "linear-gradient(rgba(255,201,121,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,201,121,0.055) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to right,black,transparent 90%)",
        }} />
        <div className="relative mx-auto max-w-[1600px] px-5 py-16 sm:px-8 sm:py-20 lg:py-24 2xl:px-10">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#ffc979]">
              <span className="h-px w-8 bg-[#f06f61]" aria-hidden="true" /> Build your package
            </p>
            <h1 className="mt-5 max-w-3xl font-playfair text-4xl font-bold leading-[1.05] text-[#fff8f2] sm:text-5xl lg:text-[3.5rem] 2xl:text-6xl">
              One beautiful base. <span className="text-[#ffc979]">Only the extras you want.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#cdbfce] sm:text-lg 2xl:text-xl 2xl:leading-9">
              Start at {formatInr(BASE_PACKAGE.priceInr)}, shape the surprise around your story, and see the exact total before checkout.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-[#a99baa]">
              <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#ffc979]" /> One-time payment</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-[#ffc979]" /> Secure Razorpay checkout</span>
              <span className="inline-flex items-center gap-2"><Zap size={16} className="text-[#ffc979]" /> Instant digital delivery</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#eadfd9] bg-[#fff1eb]">
        <div className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 2xl:px-10">
          <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#b44552]">Quick start</p>
              <h2 className="mt-2 font-playfair text-3xl font-bold text-[#241728]">Choose a ready-made mix</h2>
            </div>
            <p className="text-sm text-[#756876]">You can fine-tune every selection below.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {BUNDLES.map((bundle) => {
              const price = computePriceInr(bundle.addons);
              const isActive = activeBundle === bundle.id;
              return (
                <button
                  key={bundle.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => applyBundle(bundle.addons)}
                  className={`relative flex min-h-44 flex-col rounded-lg border-2 bg-white p-6 text-left transition-all ${isActive
                    ? "border-[#b44552] shadow-[0_16px_40px_rgba(180,69,82,0.14)]"
                    : "border-[#ecd9d2] hover:-translate-y-1 hover:border-[#d59b98]"}`}
                >
                  {bundle.badge && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#f06f61] px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.08em] text-white">
                      {bundle.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-playfair text-2xl font-bold text-[#241728]">{bundle.label}</span>
                    {isActive && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-[#b44552] text-white"><Check size={13} /></span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#756876]">{bundle.tagline}</p>
                  <p className="mt-auto pt-5 text-2xl font-extrabold text-[#b44552]">{formatInr(price)}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-20 2xl:grid-cols-[minmax(0,1fr)_400px] 2xl:px-10">
        <div className="min-w-0 space-y-12">
          <section className="rounded-lg border border-[#e3cbc3] bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-4 border-b border-[#eadfd9] pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#b44552]">Always included</p>
                <h2 className="mt-2 font-playfair text-3xl font-bold">{BASE_PACKAGE.label}</h2>
              </div>
              <div className="sm:text-right">
                <p className="text-3xl font-extrabold text-[#b44552]">{formatInr(BASE_PACKAGE.priceInr)}</p>
                <p className="mt-1 text-xs font-semibold text-[#8b7d89]">one-time base price</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {BASE_PACKAGE.includes.map((feature) => (
                <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-[#615866]">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e7f3e8] text-[#357346]"><Check size={13} /></span>
                  {feature}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-6">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#b44552]">Make it personal</p>
              <h2 className="mt-2 font-playfair text-3xl font-bold">Add extra features</h2>
              <p className="mt-2 text-sm leading-6 text-[#756876]">Select only what fits your celebration. Your total updates instantly.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {FEATURE_ADDONS.map((addon) => {
                const isSelected = selected.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggle(addon.id)}
                    className={`flex min-h-32 items-start gap-4 rounded-lg border p-5 text-left transition-all ${isSelected
                      ? "border-[#b44552] bg-[#fff1eb] shadow-[0_10px_28px_rgba(180,69,82,0.09)]"
                      : "border-[#e5d9d4] bg-white hover:border-[#d59b98]"}`}
                  >
                    <span className="text-2xl" aria-hidden="true">{addon.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-[#332638]">{addon.label}</span>
                      <span className="mt-1 block text-sm leading-5 text-[#756876]">{addon.description}</span>
                      <span className="mt-3 block text-sm font-extrabold text-[#b44552]">+{formatInr(addon.priceInr)}</span>
                    </span>
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${isSelected
                      ? "border-[#b44552] bg-[#b44552] text-white"
                      : "border-[#d8c8c2] text-[#9a8b96]"}`}>{isSelected ? <Check size={15} /> : <Plus size={15} />}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside>
          <div className="rounded-lg bg-[#18101e] p-6 text-white shadow-[0_24px_60px_rgba(36,23,40,0.18)] lg:sticky lg:top-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={19} className="text-[#ffc979]" />
                <h2 className="font-playfair text-2xl font-bold">Your package</h2>
              </div>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-[#cdbfce]">{selected.length} extras</span>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 text-[#f5eaf2]">
                <span>{BASE_PACKAGE.label}</span><span className="font-bold">{formatInr(BASE_PACKAGE.priceInr)}</span>
              </div>
              {FEATURE_ADDONS.filter((addon) => selected.includes(addon.id)).map((addon) => (
                <div key={addon.id} className="flex justify-between gap-4 text-[#cdbfce]">
                  <span className="min-w-0">{addon.icon} {addon.label}</span><span className="shrink-0">+{formatInr(addon.priceInr)}</span>
                </div>
              ))}
              {selected.length === 0 && <p className="rounded-md bg-white/5 p-3 text-xs leading-5 text-[#a99baa]">Your base website is ready to personalize. Add extras whenever they make the story better.</p>}
            </div>

            <div className="my-6 border-t border-white/10" />
            <div className="flex items-end justify-between">
              <span className="text-sm font-semibold text-[#a99baa]">Total in INR</span>
              <span className="text-4xl font-extrabold text-[#ffc979]">{formatInr(total)}</span>
            </div>
            <button onClick={startCreate} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#f06f61] px-5 py-4 font-extrabold text-white transition-colors hover:bg-[#dc5b51]">
              Create My Website <ArrowRight size={17} />
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#a99baa]"><LockKeyhole size={13} /> Secure payment via Razorpay</div>
            <p className="mt-5 border-t border-white/10 pt-5 text-xs leading-5 text-[#8e818f]">
              Invoices are issued by {BUSINESS.publicName}. By continuing, you agree to our <Link href="/terms" className="font-bold text-[#ffc979] hover:underline">Terms</Link> and <Link href="/refund-policy" className="font-bold text-[#ffc979] hover:underline">Refund Policy</Link>.
            </p>
          </div>
        </aside>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
