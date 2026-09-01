"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import { ArrowLeft, Eye, Smartphone, Monitor, MapPin, Share2, Lock } from "lucide-react";

interface ViewLog {
  ts?: { toDate: () => Date } | null;
  device?: string;
  ref?: string;
  city?: string;
  country?: string;
}

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [celeb, setCeleb] = useState<any>(null);
  const [logs, setLogs] = useState<ViewLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.CELEBRATIONS, id));
        if (!snap.exists() || snap.data()?.userId !== user.uid) {
          router.push("/dashboard");
          return;
        }
        setCeleb({ id: snap.id, ...snap.data() });
        const logSnap = await getDocs(
          query(collection(db, COLLECTIONS.CELEBRATIONS, id, "viewLog"), orderBy("ts", "desc"), limit(1000))
        );
        setLogs(logSnap.docs.map((d) => d.data() as ViewLog));
      } catch {
        // viewLog may be empty / index building — show what we have
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id, router]);

  const isAdvanced = !!celeb?.selectedFeatures?.includes?.("advanced_analytics");

  const daily = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    const map = new Map<string, number>();
    for (const l of logs) {
      const d = l.ts?.toDate ? l.ts.toDate() : null;
      if (!d) continue;
      const key = d.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), count: map.get(key) ?? 0 });
    }
    return days;
  }, [logs]);

  const maxDaily = Math.max(1, ...daily.map((d) => d.count));

  const breakdown = useMemo(() => {
    const tally = (key: keyof ViewLog) => {
      const m = new Map<string, number>();
      for (const l of logs) {
        const v = (l[key] as string) || "";
        if (!v) continue;
        m.set(v, (m.get(v) ?? 0) + 1);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    };
    return { devices: tally("device"), refs: tally("ref"), cities: tally("city") };
  }, [logs]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <div className="text-4xl animate-bounce">📊</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: "var(--bg-deep)" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-6">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold font-playfair mb-1">
          Analytics — <span className="gradient-text">{celeb?.recipientName}</span>
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">How your surprise is performing.</p>

        {/* Headline stat */}
        <div className="glass-card p-6 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
            <Eye size={22} className="text-amber-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-amber-400">{(celeb?.views ?? 0).toLocaleString()}</div>
            <div className="text-xs text-[var(--text-muted)]">Total views</div>
          </div>
        </div>

        {/* Timeline — free for everyone */}
        <div className="glass-card p-6 mb-6">
          <h3 className="font-semibold mb-4">Last 14 days</h3>
          <div className="flex items-end gap-1.5 h-32">
            {daily.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5" title={`${d.label}: ${d.count}`}>
                <div className="w-full rounded-t" style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count ? 4 : 2, background: d.count ? "linear-gradient(180deg,#a855f7,#ec4899)" : "rgba(255,255,255,0.06)" }} />
                <span className="text-[0.6rem] text-white/40 rotate-0">{d.label.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced — gated */}
        {isAdvanced ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <BreakdownCard title="Devices" icon={<Smartphone size={15} />} rows={breakdown.devices} />
            <BreakdownCard title="Came from" icon={<Share2 size={15} />} rows={breakdown.refs} />
            <BreakdownCard title="Top places" icon={<MapPin size={15} />} rows={breakdown.cities} empty="Location data appears once viewers open it" />
          </div>
        ) : (
          <div className="glass-card p-6 text-center">
            <Lock size={22} className="mx-auto text-purple-400 mb-3" />
            <h3 className="font-semibold mb-1">Unlock Advanced Analytics</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              See anonymous visit trends, referral sources, and device types. This does not identify individual visitors.
            </p>
            <Link href="/pricing" className="btn-primary text-sm py-2 px-5">Explore add-ons</Link>
          </div>
        )}
      </div>
    </main>
  );
}

function BreakdownCard({ title, icon, rows, empty }: { title: string; icon: React.ReactNode; rows: [string, number][]; empty?: string }) {
  const total = rows.reduce((s, [, n]) => s + n, 0) || 1;
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-1.5 mb-3 text-sm font-semibold">
        <span className="text-purple-400">{icon}</span> {title}
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">{empty ?? "No data yet"}</p>
      ) : (
        <div className="space-y-2">
          {rows.map(([label, n]) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="capitalize truncate">{label}</span>
                <span className="text-white/50">{n}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: `${(n / total) * 100}%`, background: "linear-gradient(90deg,#a855f7,#ec4899)" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
