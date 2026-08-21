"use client";

import { FormEvent, useState } from "react";
import { Banknote, CheckCircle2, Clock3, Landmark, LoaderCircle, X, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatInr } from "@/lib/constants";
import { MIN_WALLET_WITHDRAWAL_INR } from "@/lib/wallet-withdrawal";

interface WithdrawalRequest {
  id: string;
  amountInr: number;
  status: "pending" | "paid" | "rejected";
  bankAccountLast4: string;
  ifsc: string;
  createdAt: string | null;
  payoutReference: string | null;
  rejectionReason: string | null;
}

interface WithdrawalData {
  withdrawableBalance: number;
  minimumWithdrawal: number;
  hasPendingRequest: boolean;
  requests: WithdrawalRequest[];
}

export default function WalletWithdrawal({ initialWithdrawableBalance }: { initialWithdrawableBalance: number }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<WithdrawalData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [amount, setAmount] = useState(String(initialWithdrawableBalance));
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");

  const loadWithdrawals = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/wallet/withdrawals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load withdrawals");
      setData(result);
      setAmount(String(result.withdrawableBalance));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/wallet/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amountInr: Number(amount), accountHolderName, accountNumber, ifsc }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to request withdrawal");
      setSuccess("Withdrawal requested. Your wallet funds are reserved until the bank transfer is reviewed.");
      setAccountNumber("");
      await loadWithdrawals();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to request withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  const available = data?.withdrawableBalance ?? initialWithdrawableBalance;
  const minimum = data?.minimumWithdrawal ?? MIN_WALLET_WITHDRAWAL_INR;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          void loadWithdrawals();
        }}
        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white border border-green-400/30 bg-green-500/15 hover:bg-green-500/25 transition-colors"
      >
        <Banknote size={16} /> Withdraw to bank
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70" role="dialog" aria-modal="true" aria-labelledby="withdrawal-title">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#17101f] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#17101f]">
              <div className="flex items-center gap-2.5">
                <Landmark size={19} className="text-green-400" />
                <h2 id="withdrawal-title" className="font-bold text-lg">Bank withdrawal</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 text-white/60 hover:text-white" title="Close">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="text-xs text-[var(--text-muted)]">Cash available</div>
                  <div className="text-xl font-bold text-green-400 mt-1">{formatInr(available)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="text-xs text-[var(--text-muted)]">Minimum transfer</div>
                  <div className="text-xl font-bold mt-1">{formatInr(minimum)}</div>
                </div>
              </div>

              {loading ? (
                <div className="py-12 flex justify-center"><LoaderCircle className="animate-spin text-green-400" /></div>
              ) : (
                <>
                  {data?.hasPendingRequest ? (
                    <div className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200 mb-5 flex gap-2">
                      <Clock3 size={17} className="shrink-0 mt-0.5" /> A withdrawal is already being reviewed. You can submit another after it is processed.
                    </div>
                  ) : available < minimum ? (
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-[var(--text-muted)] mb-5">
                      Earn {formatInr(minimum - available)} more from completed referrals to unlock bank withdrawal. Promotional signup credit remains available at checkout.
                    </div>
                  ) : (
                    <form onSubmit={submit} className="space-y-3 mb-6">
                      <label className="block text-xs font-medium text-white/75">
                        Amount
                        <input type="number" min={minimum} max={available} step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} className="input-field mt-1.5 w-full" />
                      </label>
                      <label className="block text-xs font-medium text-white/75">
                        Account holder name
                        <input type="text" minLength={2} maxLength={80} required autoComplete="name" value={accountHolderName} onChange={(event) => setAccountHolderName(event.target.value)} className="input-field mt-1.5 w-full" />
                      </label>
                      <label className="block text-xs font-medium text-white/75">
                        Bank account number
                        <input type="text" inputMode="numeric" pattern="[0-9 -]{9,22}" required autoComplete="off" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} className="input-field mt-1.5 w-full" />
                      </label>
                      <label className="block text-xs font-medium text-white/75">
                        IFSC code
                        <input type="text" minLength={11} maxLength={11} required autoCapitalize="characters" value={ifsc} onChange={(event) => setIfsc(event.target.value.toUpperCase())} className="input-field mt-1.5 w-full uppercase" placeholder="ABCD0123456" />
                      </label>
                      <p className="text-xs text-[var(--text-muted)]">Account numbers are encrypted. Transfers are reviewed before payment.</p>
                      <button type="submit" disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-50">
                        {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Banknote size={16} />}
                        Request {formatInr(Number(amount) || 0)}
                      </button>
                    </form>
                  )}

                  {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300 mb-4">{error}</div>}
                  {success && <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-300 mb-4">{success}</div>}

                  {data && data.requests.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Recent requests</h3>
                      <div className="space-y-2">
                        {data.requests.slice(0, 5).map((request) => (
                          <div key={request.id} className="rounded-lg border border-white/10 px-3 py-2.5 flex items-start justify-between gap-3 text-sm">
                            <div>
                              <div className="font-semibold">{formatInr(request.amountInr)} <span className="font-normal text-white/50">to •••• {request.bankAccountLast4}</span></div>
                              <div className="text-xs text-white/45 mt-0.5">{request.createdAt ? new Date(request.createdAt).toLocaleDateString("en-IN") : ""} · {request.ifsc}</div>
                              {request.payoutReference && <div className="text-xs text-green-300 mt-1">Ref: {request.payoutReference}</div>}
                              {request.rejectionReason && <div className="text-xs text-red-300 mt-1">{request.rejectionReason}</div>}
                            </div>
                            <span className={`flex items-center gap-1 text-xs capitalize ${request.status === "paid" ? "text-green-400" : request.status === "rejected" ? "text-red-400" : "text-amber-300"}`}>
                              {request.status === "paid" ? <CheckCircle2 size={13} /> : request.status === "rejected" ? <XCircle size={13} /> : <Clock3 size={13} />}
                              {request.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}