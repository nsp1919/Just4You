"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { ArrowLeft, CalendarDays, CheckCircle, Download, Heart, UserRoundCheck, UserRoundX, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";

interface RsvpCeremony {
  id: string;
  name: string;
}

interface WeddingRsvp {
  id: string;
  name: string;
  attending: "yes" | "no";
  ceremonies: RsvpCeremony[];
  guestCount: number;
  team: "bride" | "groom" | "";
  createdAt?: Timestamp | null;
}

function escapeCsv(value: string | number): string {
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

export default function WeddingRsvpPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("Wedding invitation");
  const [responses, setResponses] = useState<WeddingRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !id) return;

    const loadResponses = async () => {
      try {
        const celebration = await getDoc(doc(db, COLLECTIONS.CELEBRATIONS, id));
        if (!celebration.exists() || celebration.data().userId !== user.uid) {
          router.replace("/dashboard");
          return;
        }

        const data = celebration.data();
        const partnerOne = data.weddingData?.couple?.partnerOne;
        const partnerTwo = data.weddingData?.couple?.partnerTwo;
        if (partnerOne && partnerTwo) setTitle(`${partnerOne} & ${partnerTwo}`);

        const responseSnapshot = await getDocs(
          query(
            collection(db, COLLECTIONS.CELEBRATIONS, id, "rsvps"),
            orderBy("createdAt", "desc"),
          ),
        );
        setResponses(responseSnapshot.docs.map((response) => ({
          id: response.id,
          ...response.data(),
        } as WeddingRsvp)));
      } catch (loadError) {
        console.error("Failed to load wedding RSVPs:", loadError);
        setError("Unable to load RSVPs right now. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };

    void loadResponses();
  }, [user, id, router]);

  const summary = useMemo(() => {
    const attending = responses.filter((response) => response.attending === "yes");
    return {
      attending: attending.length,
      declined: responses.length - attending.length,
      guests: attending.reduce((total, response) => total + response.guestCount, 0),
      bride: responses.filter((response) => response.team === "bride").length,
      groom: responses.filter((response) => response.team === "groom").length,
    };
  }, [responses]);

  const downloadCsv = () => {
    const rows = [
      ["Name", "Attending", "Guest count", "Celebrations", "Team", "Submitted"],
      ...responses.map((response) => [
        response.name,
        response.attending === "yes" ? "Yes" : "No",
        response.guestCount,
        response.ceremonies.map((ceremony) => ceremony.name).join(", "),
        response.team || "Not selected",
        response.createdAt?.toDate?.().toLocaleString("en-IN") ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-rsvps.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-emerald-400" aria-label="Loading RSVPs" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-10" style={{ background: "var(--bg-deep)" }}>
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="mb-7 inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Guest responses</p>
            <h1 className="font-playfair text-3xl font-bold text-white sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Attendance, party size, ceremonies, and team choices.</p>
          </div>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={responses.length === 0}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/25 bg-red-400/[0.08] p-4 text-sm text-red-200">{error}</div>
        ) : (
          <>
            <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="RSVP summary">
              <SummaryStat icon={<Users size={19} />} label="Responses" value={responses.length} color="#fbbf24" />
              <SummaryStat icon={<UserRoundCheck size={19} />} label="Attending" value={summary.attending} color="#34d399" />
              <SummaryStat icon={<UserRoundX size={19} />} label="Declined" value={summary.declined} color="#fb7185" />
              <SummaryStat icon={<CalendarDays size={19} />} label="Total guests" value={summary.guests} color="#60a5fa" />
              <SummaryStat icon={<Heart size={19} />} label="Bride / Groom" value={`${summary.bride} / ${summary.groom}`} color="#f472b6" />
            </section>

            {responses.length === 0 ? (
              <section className="border-y border-white/10 py-16 text-center">
                <CheckCircle size={28} className="mx-auto mb-3 text-emerald-300" />
                <h2 className="font-playfair text-2xl font-semibold text-white">Waiting for the first reply</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Responses will appear here after guests submit the invitation form.</p>
              </section>
            ) : (
              <section className="divide-y divide-white/10 border-y border-white/10" aria-label="Guest RSVP responses">
                {responses.map((response) => (
                  <article key={response.id} className="grid gap-4 py-5 md:grid-cols-[minmax(10rem,0.8fr)_minmax(15rem,1.5fr)_auto] md:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white">{response.name}</strong>
                        <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${response.attending === "yes" ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>
                          {response.attending === "yes" ? "Attending" : "Declined"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/40">
                        {response.createdAt?.toDate?.().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) ?? "Just now"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {response.attending === "yes" && response.ceremonies.length > 0
                        ? response.ceremonies.map((ceremony) => (
                          <span key={ceremony.id} className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-2.5 py-1 text-xs text-amber-100">
                            {ceremony.name}
                          </span>
                        ))
                        : <span className="text-xs text-white/40">No ceremonies selected</span>}
                    </div>

                    <div className="flex gap-5 text-sm md:justify-end">
                      <span><strong className="block text-lg text-white">{response.guestCount}</strong><small className="text-white/40">guests</small></span>
                      <span><strong className="block text-sm capitalize text-white">{response.team || "-"}</strong><small className="text-white/40">team</small></span>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function SummaryStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <span className="mb-3 block" style={{ color }}>{icon}</span>
      <strong className="block text-2xl text-white">{value}</strong>
      <span className="mt-1 block text-xs text-white/45">{label}</span>
    </div>
  );
}