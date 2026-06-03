"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, getDocs, updateDoc, doc, where, Timestamp
} from "firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import { Users, DollarSign, Globe, TrendingUp, Search, Ban, CheckCircle, Eye, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "orders" | "users">("overview");
  const [celebrations, setCelebrations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push("/login"); return; }
      if (userDoc && userDoc.role !== "admin") { router.push("/dashboard"); return; }
    }
  }, [user, userDoc, loading]);

  useEffect(() => {
    if (!user || userDoc?.role !== "admin") return;
    const fetchAll = async () => {
      const [celebSnap, userSnap] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.CELEBRATIONS), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, COLLECTIONS.USERS), orderBy("createdAt", "desc"))),
      ]);
      setCelebrations(celebSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setUsers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setFetching(false);
    };
    fetchAll();
  }, [user, userDoc]);

  const toggleBlockCelebration = async (id: string, current: boolean) => {
    await updateDoc(doc(db, COLLECTIONS.CELEBRATIONS, id), { isBlocked: !current });
    setCelebrations((cs) => cs.map((c) => c.id === id ? { ...c, isBlocked: !current } : c));
  };

  const toggleBlockUser = async (id: string, current: boolean) => {
    await updateDoc(doc(db, COLLECTIONS.USERS, id), { isBlocked: !current });
    setUsers((us) => us.map((u) => u.id === id ? { ...u, isBlocked: !current } : u));
  };

  if (loading || !user || !userDoc) return null;

  const paidCelebrations = celebrations.filter((c) => c.paymentStatus === "paid");
  const totalRevenue = paidCelebrations.length * 299;
  const today = new Date();
  const todayRevenue = paidCelebrations.filter((c) => {
    const d = c.createdAt?.toDate?.();
    return d && d.toDateString() === today.toDateString();
  }).length * 299;

  const filteredCelebrations = celebrations.filter((c) =>
    c.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
    c.slug?.includes(search)
  );
  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-deep)" }}>
      {/* Navbar */}
      <nav className="border-b border-purple-500/10 px-6 py-4" style={{ background: "rgba(10,6,18,0.95)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-purple-400" />
            <span className="font-bold gradient-text">Admin Panel</span>
          </div>
          <Link href="/dashboard" className="text-sm text-[var(--text-muted)] hover:text-white">← Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: <DollarSign size={20} />, color: "#22c55e" },
            { label: "Today Revenue", value: `₹${todayRevenue}`, icon: <TrendingUp size={20} />, color: "#f59e0b" },
            { label: "Total Orders", value: paidCelebrations.length, icon: <Globe size={20} />, color: "#a855f7" },
            { label: "Total Users", value: users.length, icon: <Users size={20} />, color: "#ec4899" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-5">
              <div style={{ color: s.color }} className="mb-2">{s.icon}</div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["overview", "orders", "users"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all ${tab === t ? "text-white" : "text-[var(--text-muted)] hover:text-white"}`}
              style={tab === t ? { background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)" } : { background: "transparent" }}>
              {t}
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..." className="input-field pl-9 py-2 text-sm w-48" />
          </div>
        </div>

        {/* Orders table */}
        {(tab === "overview" || tab === "orders") && (
          <div className="glass-card overflow-hidden mb-6">
            <div className="p-4 border-b border-purple-500/10">
              <h2 className="font-semibold">{tab === "overview" ? "Recent Orders" : "All Orders"}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-500/10" style={{ background: "rgba(168,85,247,0.05)" }}>
                    {["Name", "Slug", "Theme", "Photos", "Status", "Views", "Date", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-[var(--text-muted)] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(tab === "overview" ? filteredCelebrations.slice(0, 10) : filteredCelebrations).map((c) => (
                    <tr key={c.id} className="border-b border-purple-500/5 hover:bg-purple-500/5 transition-colors">
                      <td className="px-4 py-3 font-medium">{c.recipientName}</td>
                      <td className="px-4 py-3 text-purple-400 font-mono text-xs">{c.slug || "—"}</td>
                      <td className="px-4 py-3 capitalize">{c.theme}</td>
                      <td className="px-4 py-3">{c.photos?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.paymentStatus === "paid" ? "text-green-400" : "text-yellow-400"}`}
                          style={{ background: c.paymentStatus === "paid" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)" }}>
                          {c.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex items-center gap-1">
                        <Eye size={12} className="text-[var(--text-muted)]" /> {c.views ?? 0}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                        {c.createdAt?.toDate?.()?.toLocaleDateString("en-IN") ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleBlockCelebration(c.id, c.isBlocked)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${c.isBlocked ? "text-green-400" : "text-red-400"}`}
                          style={{ background: c.isBlocked ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
                          {c.isBlocked ? <><CheckCircle size={11} /> Unblock</> : <><Ban size={11} /> Block</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users table */}
        {(tab === "overview" || tab === "users") && (
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-purple-500/10">
              <h2 className="font-semibold">{tab === "overview" ? "Recent Users" : "All Users"}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-500/10" style={{ background: "rgba(168,85,247,0.05)" }}>
                    {["Name", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-[var(--text-muted)] font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(tab === "overview" ? filteredUsers.slice(0, 10) : filteredUsers).map((u) => (
                    <tr key={u.id} className="border-b border-purple-500/5 hover:bg-purple-500/5 transition-colors">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === "admin" ? "text-yellow-400" : "text-[var(--text-muted)]"}`}
                          style={{ background: u.role === "admin" ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)" }}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${u.isBlocked ? "text-red-400" : "text-green-400"}`}>
                          {u.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                        {u.createdAt?.toDate?.()?.toLocaleDateString("en-IN") ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {u.role !== "admin" && (
                          <button onClick={() => toggleBlockUser(u.id, u.isBlocked)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${u.isBlocked ? "text-green-400" : "text-red-400"}`}
                            style={{ background: u.isBlocked ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
                            {u.isBlocked ? <><CheckCircle size={11} /> Unblock</> : <><Ban size={11} /> Block</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
