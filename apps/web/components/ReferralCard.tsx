"use client";
import { useEffect, useState } from "react";
import { Copy, Check, Gift, Trophy } from "lucide-react";
import { referralLinkFor } from "@/lib/referral";
import { REFERRAL_MILESTONE_COUNT } from "@/lib/constants";
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
      className="rounded-2xl p-6 mb-10 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,138,92,0.12), rgba(255,95,147,0.10))",
        border: "1px solid rgba(255,138,92,0.28)",
      }}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: refer & earn */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Gift size={18} style={{ color: "#ff8a5c" }} />
            <h3 className="font-bold text-lg">Friend gets ₹{joinBonusInr}, you get ₹{referrerRewardInr}</h3>
            <span id="wallet-balance" className="ml-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/25 whitespace-nowrap">
              Wallet Balance: ₹{walletBalance}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] max-w-md mb-3">
            Friends receive ₹{joinBonusInr} in their wallet when they join. You receive
            ₹{referrerRewardInr} in your wallet after their first successful purchase. Verified referral and social-post earnings can be withdrawn after reaching the current Admin-set minimum shown in the bank withdrawal form.
          </p>
          {/* Milestone progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[var(--text-muted)]">
                {freeAddonCredits > 0
                  ? `${freeAddonCredits} free premium add-on${freeAddonCredits > 1 ? "s" : ""} available`
                  : `${toNextMilestone} more referral${toNextMilestone > 1 ? "s" : ""} → a FREE premium add-on`}
              </span>
              <span className="font-semibold text-orange-300">{referralCount % REFERRAL_MILESTONE_COUNT}/{REFERRAL_MILESTONE_COUNT}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${((referralCount % REFERRAL_MILESTONE_COUNT) / REFERRAL_MILESTONE_COUNT) * 100}%`, background: "linear-gradient(90deg,#ff8a5c,#ff5f93)" }}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:max-w-md">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-black/25 border border-white/10 flex-1">
              <span className="text-xs text-white/70 truncate flex-1">{link}</span>
              <button onClick={copy} className="shrink-0 text-white/80 hover:text-white" title="Copy link">
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
            <button
              onClick={shareWhatsApp}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white shrink-0"
              style={{ background: "#25D366" }}
            >
              Share on WhatsApp
            </button>
            <WalletWithdrawal initialWithdrawableBalance={withdrawableBalance} />
          </div>
        </div>

        {/* Right: leaderboard */}
        {leaders.length > 0 && (
          <div className="lg:w-64 rounded-xl p-4" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }}>
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
    </div>
  );
}
