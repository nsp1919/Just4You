"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Plus, ArrowRight, ShoppingCart, ArrowLeft } from "lucide-react";
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
    <main className="min-h-screen bg-[#0a0612] text-white px-5 py-14">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-8">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-purple-300 mb-4">
            Build Your Package
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Pay only for the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-400">
              features you want
            </span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Start from the base website and add the extras that make your surprise special. Your
            price updates as you build — no plans, no lock-in.
          </p>
        </div>

        {/* Quick bundles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {BUNDLES.map((b) => {
            const price = computePriceInr(b.addons);
            const isActive = activeBundle === b.id;
            return (
              <button
                key={b.id}
                onClick={() => applyBundle(b.addons)}
                className="text-left rounded-2xl p-5 border transition-all relative"
                style={{
                  borderColor: isActive ? "rgba(255,138,92,0.6)" : "rgba(255,255,255,0.1)",
                  background: isActive ? "rgba(255,138,92,0.1)" : "rgba(255,255,255,0.03)",
                }}
              >
                {b.badge && (
                  <span
                    className="absolute -top-2.5 right-4 text-[0.65rem] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "linear-gradient(135deg,#ff8a5c,#ff5f93)" }}
                  >
                    {b.badge}
                  </span>
                )}
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-lg">{b.label}</h3>
                  {isActive && <Check size={18} className="text-orange-400" />}
                </div>
                <p className="text-sm text-white/50 mb-3">{b.tagline}</p>
                <div className="text-2xl font-bold">{formatInr(price)}</div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: base + add-ons */}
          <div className="lg:col-span-2 space-y-6">
            {/* Base */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-purple-300 font-semibold mb-1">
                    Always included
                  </div>
                  <h2 className="text-xl font-bold">{BASE_PACKAGE.label}</h2>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatInr(BASE_PACKAGE.priceInr)}</div>
                  <div className="text-xs text-white/40">base price</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BASE_PACKAGE.includes.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-white/70">
                    <Check size={15} className="text-green-400 mt-0.5 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <h2 className="text-lg font-bold mb-4">Add extra features</h2>
              <div className="space-y-3">
                {FEATURE_ADDONS.map((a) => {
                  const on = selected.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggle(a.id)}
                      className="w-full text-left rounded-xl border p-4 flex items-center gap-4 transition-all"
                      style={{
                        borderColor: on ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.1)",
                        background: on ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div className="text-2xl shrink-0">{a.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold">{a.label}</div>
                        <div className="text-sm text-white/50">{a.description}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold">+{formatInr(a.priceInr)}</div>
                      </div>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: on ? "#22c55e" : "rgba(255,255,255,0.08)",
                          color: on ? "#0a0612" : "#fff",
                        }}
                      >
                        {on ? <Check size={16} /> : <Plus size={16} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: sticky cart */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-2 mb-5">
                <ShoppingCart size={18} className="text-pink-400" />
                <h3 className="font-bold text-lg">Your package</h3>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-white/80">
                  <span>{BASE_PACKAGE.label}</span>
                  <span>{formatInr(BASE_PACKAGE.priceInr)}</span>
                </div>
                {FEATURE_ADDONS.filter((a) => selected.includes(a.id)).map((a) => (
                  <div key={a.id} className="flex justify-between text-white/80">
                    <span className="flex items-center gap-1.5">
                      <span>{a.icon}</span> {a.label}
                    </span>
                    <span>+{formatInr(a.priceInr)}</span>
                  </div>
                ))}
                {selected.length === 0 && (
                  <div className="text-white/40 text-xs pt-1">No extras added yet — the base website is a lovely start.</div>
                )}
              </div>

              <div className="border-t border-white/10 my-5" />

              <div className="flex items-end justify-between mb-6">
                <span className="text-white/60">Total</span>
                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-400">
                  {formatInr(total)}
                </span>
              </div>

              <button
                onClick={startCreate}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-white"
                style={{ background: "linear-gradient(135deg, #ff8a5c, #ff5f93)" }}
              >
                Create My Website <ArrowRight size={16} />
              </button>
              <p className="text-center text-xs text-white/40 mt-3">
                One-time payment · No hidden fees · 1 year hosting
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
