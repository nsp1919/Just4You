"use client";
import { useEffect, useState } from "react";
import { Copy, Check, ChevronDown, Gift, Trophy } from "lucide-react";
import { referralLinkFor } from "@/lib/referral";
import { formatInr, REFERRAL_MILESTONE_COUNT } from "@/lib/constants";
import { useReferralRewards } from "@/lib/use-referral-rewards";
import WalletWithdrawal from "@/components/WalletWithdrawal";

interface Leader {
  rank: number;
  name: string;
  walletBalance: number;
  referrals: number;
}

/**
 * Refer & Earn card for the dashboard. Each user gets a personal share link;
 * friends who sign up through it receive ₹50 in their wallet, and the referrer
 * earns ₹50 in their wallet once that friend's first surprise is paid for. Shows milestone
 * progress and a public leaderboard for social proof.
 */
export default function ReferralCard({
  uid,
  walletBalance = 0,
  walletWithdrawableBalance,
  referralCount = 0,
  freeAddonCredits = 0,
}: {
  uid: string;
  walletBalance?: number;
  walletWithdrawableBalance?: number;
  referralCount?: number;
  freeAddonCredits?: number;
}) {
  const { referrerRewardInr, joinBonusInr } = useReferralRewards();
  const [copied, setCopied] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const link = referralLinkFor(uid);
  const withdrawableBalance = Math.min(
    walletBalance,
    walletWithdrawableBalance ?? referralCount * referrerRewardInr,
  );

  useEffect(() => {
    fetch("/api/referral/leaderboard")
      .then((r) => r.json())
      .then((d) => setLeaders(Array.isArray(d.leaders) ? d.leaders : []))
      .catch(() => setLeaders([]));
  }, []);

  const toNextMilestone = REFERRAL_MILESTONE_COUNT - (referralCount % REFERRAL_MILESTONE_COUNT);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — no-op
    }
  };

  const shareWhatsApp = () => {
    const text = `I made an amazing personalized surprise website on Just4You.buzz 🎉 Join with my link and get ₹${joinBonusInr} in your wallet:\n\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      className="rounded-lg p-4 mb-7 relative overflow-hidden"
      style={{
        background: "rgba(255,138,92,0.055)",
        border: "1px solid rgba(255,138,92,0.2)",
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Left: refer & earn */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange-300/10 text-orange-300"><Gift size={18} /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="font-bold text-[#fff5ec]">Refer &amp; Earn</h3>
                <span id="wallet-balance" className="text-xs font-bold text-green-400 whitespace-nowrap">
                  Wallet {formatInr(walletBalance)}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Friend gets <strong className="text-white/80">{formatInr(joinBonusInr)}</strong> on joining. You earn <strong className="text-white/80">{formatInr(referrerRewardInr)}</strong> after their first purchase.
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:mt-0 lg:hidden">
            <button onClick={copy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 text-sm font-semibold text-white/70 hover:border-white/20 hover:text-white">
              {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />} {copied ? "Copied" : "Copy link"}
            </button>
            <button
              onClick={shareWhatsApp}
              className="min-h-10 rounded-lg px-4 text-sm font-semibold text-white"
              style={{ background: "#25D366" }}
            >
              Share link
            </button>
            <div className="col-span-2 sm:col-span-1 [&>button]:w-full"><WalletWithdrawal initialWithdrawableBalance={withdrawableBalance} /></div>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <button onClick={copy} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/70 hover:border-white/20 hover:text-white">
            {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />} {copied ? "Copied" : "Copy link"}
          </button>
          <button onClick={shareWhatsApp} className="min-h-10 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-white">Share</button>
          <WalletWithdrawal initialWithdrawableBalance={withdrawableBalance} />
        </div>

        {/* Right: leaderboard */}
        {leaders.length > 0 && false && (
          <div className="lg:w-64 rounded-lg p-4" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-1.5 mb-3">
              <Trophy size={15} className="text-amber-400" />
              <h4 className="font-semibold text-sm">Top Referrers</h4>
            </div>
            <div className="space-y-2">
              {leaders.slice(0, 5).map((l) => (
                <div key={l.rank} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-4 text-center">{l.rank === 1 ? "🥇" : l.rank === 2 ? "🥈" : l.rank === 3 ? "🥉" : l.rank}</span>
                    <span className="text-white/80">{l.name}</span>
                  </span>
                  <span className="font-semibold text-green-400">₹{l.walletBalance}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <details className="group mt-3 border-t border-white/[0.07] pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-white/55 hover:text-white/80">
          <span>{referralCount} completed referral{referralCount === 1 ? "" : "s"} · {freeAddonCredits > 0 ? `${freeAddonCredits} premium add-on credit${freeAddonCredits === 1 ? "" : "s"}` : `${toNextMilestone} to next premium add-on`}</span>
          <ChevronDown size={15} className="transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_16rem]">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-muted)]"><span>Premium add-on progress</span><span>{referralCount % REFERRAL_MILESTONE_COUNT}/{REFERRAL_MILESTONE_COUNT}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#ff8a5c] to-[#ff5f93]" style={{ width: `${((referralCount % REFERRAL_MILESTONE_COUNT) / REFERRAL_MILESTONE_COUNT) * 100}%` }} /></div>
            <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">Verified referral and social-post earnings can be withdrawn after reaching the bank-transfer minimum.</p>
          </div>
          {leaders.length > 0 && <div className="rounded-lg border border-white/[0.07] bg-black/15 p-3"><div className="mb-2 flex items-center gap-1.5 text-xs font-semibold"><Trophy size={14} className="text-amber-400" /> Top referrers</div>{leaders.slice(0, 3).map((leader) => <div key={leader.rank} className="flex justify-between py-1 text-xs text-white/60"><span>{leader.rank}. {leader.name}</span><span className="text-green-400">{formatInr(leader.walletBalance)}</span></div>)}</div>}
        </div>
      </details>
    </div>
  );
}
