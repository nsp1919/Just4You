"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, CheckCircle2, LoaderCircle, PencilLine, Send, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface MinorEditRequest {
  id: string;
  celebrationId: string;
  occasionType: string;
  status: "pending" | "approved" | "rejected";
  currentValues: Record<string, string>;
  requestedValues: Record<string, string>;
  adminNote: string;
  createdAt: string | null;
  processedAt: string | null;
}

interface CelebrationEditRequestProps {
  celebration: {
    id: string;
    recipientName: string;
    occasionType?: string;
    birthdayDate: string;
    eventDate?: string;
    weddingData?: { couple?: { partnerOne?: string; partnerTwo?: string } };
  };
  request?: MinorEditRequest;
  onSubmitted: (request: MinorEditRequest) => void;
}

export default function CelebrationEditRequest({ celebration, request, onSubmitted }: CelebrationEditRequestProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [recipientName, setRecipientName] = useState(celebration.recipientName);
  const [partnerOne, setPartnerOne] = useState(celebration.weddingData?.couple?.partnerOne ?? "");
  const [partnerTwo, setPartnerTwo] = useState(celebration.weddingData?.couple?.partnerTwo ?? "");
  const [eventDate, setEventDate] = useState(celebration.eventDate || celebration.birthdayDate);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const isWedding = celebration.occasionType === "wedding";
  const pending = request?.status === "pending";

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSending(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/celebration-edit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          celebrationId: celebration.id,
          eventDate,
          ...(isWedding ? { partnerOne, partnerTwo } : { recipientName }),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send edit request");
      onSubmitted(result.request as MinorEditRequest);
      setOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send edit request");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={`flex min-h-9 items-center gap-2 rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:cursor-default ${pending ? "border-amber-300/20 bg-amber-300/[0.06] text-amber-200" : "border-white/[0.08] bg-white/[0.025] text-white/65 hover:border-amber-300/25 hover:text-amber-200"}`}
      >
        {pending ? <LoaderCircle size={14} /> : <PencilLine size={14} className="text-amber-300" />}
        {pending ? "Awaiting Admin" : "Request edit"}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[250] grid place-items-center overflow-y-auto bg-black/80 px-4 py-8 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <form onSubmit={submit} className="w-full max-w-lg overflow-hidden rounded-lg border border-white/10 bg-[#17101e] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Minor correction</p>
                <h2 className="mt-1 font-playfair text-2xl font-bold text-white">Request a name or date edit</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-white/50 hover:text-white" aria-label="Close edit request"><X size={17} /></button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex gap-3 rounded-lg border border-amber-300/15 bg-amber-300/[0.05] p-4 text-xs leading-5 text-amber-100/75">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-amber-300" />
                <p>Admin can approve small corrections to names and the main event date. Photos, messages, music, voice notes, videos, themes, and package features cannot be changed here.</p>
              </div>

              {isWedding ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-white/65">Partner one
                    <input value={partnerOne} onChange={(event) => setPartnerOne(event.target.value.slice(0, 80))} minLength={2} maxLength={80} required className="input-field mt-2 w-full" />
                  </label>
                  <label className="text-sm font-semibold text-white/65">Partner two
                    <input value={partnerTwo} onChange={(event) => setPartnerTwo(event.target.value.slice(0, 80))} minLength={2} maxLength={80} required className="input-field mt-2 w-full" />
                  </label>
                </div>
              ) : (
                <label className="block text-sm font-semibold text-white/65">Recipient name
                  <input value={recipientName} onChange={(event) => setRecipientName(event.target.value.slice(0, 80))} minLength={2} maxLength={80} required className="input-field mt-2 w-full" />
                </label>
              )}

              <label className="block text-sm font-semibold text-white/65">Main event date
                <span className="relative mt-2 block"><CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" /><input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} required className="input-field w-full pl-10" /></span>
              </label>

              {request?.status === "rejected" && request.adminNote && <p className="rounded-lg border border-rose-400/15 bg-rose-400/[0.06] p-3 text-xs text-rose-200">Previous request: {request.adminNote}</p>}
              {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">{error}</p>}
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 p-5">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost px-5 py-2.5">Cancel</button>
              <button type="submit" disabled={sending} className="btn-primary px-5 py-2.5 disabled:opacity-50">{sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}{sending ? "Sending..." : "Send to Admin"}</button>
            </div>
          </form>
        </div>,
        document.body,
      )}
    </>
  );
}
