"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, getDocs, updateDoc, doc, serverTimestamp
} from "firebase/firestore";
import { COLLECTIONS, computePriceInr } from "@/lib/constants";
import { Users, DollarSign, Globe, TrendingUp, Search, Ban, CheckCircle, Eye, Shield, Landmark, LoaderCircle, XCircle, CalendarClock, Save, Gift, Mail, Phone, PencilLine, BadgeCheck, Upload, Trash2, ExternalLink, LockKeyhole, LogOut, LayoutDashboard, Settings2 } from "lucide-react";
import Link from "next/link";

interface PrebookOrder {
  id: string;
  name: string;
  email: string;
  phone: string;
  occasion: string;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string | null;
}

interface SocialRewardClaim {
  id: string;
  userEmail: string;
  recipientName: string;
  platform: "instagram";
  instagramHandle: string;
  instagramPostUrl: string;
  rewardInr: number;
  status: "pending" | "approved" | "rejected";
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string;
}

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function AdminPage() {
  const { user, userDoc, logout, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "orders" | "launch" | "users" | "payouts" | "social">("overview");
  const [celebrations, setCelebrations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [socialClaims, setSocialClaims] = useState<SocialRewardClaim[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [payoutNotes, setPayoutNotes] = useState<Record<string, string>>({});
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);
  const [socialReviewNotes, setSocialReviewNotes] = useState<Record<string, string>>({});
  const [socialPostUrls, setSocialPostUrls] = useState<Record<string, string>>({});
  const [processingSocialClaim, setProcessingSocialClaim] = useState<string | null>(null);
  const [withdrawalError, setWithdrawalError] = useState("");
  const [prelaunchEnabled, setPrelaunchEnabled] = useState(false);
  const [launchAt, setLaunchAt] = useState("");
  const [prebookOrders, setPrebookOrders] = useState<PrebookOrder[]>([]);
  const [savingLaunch, setSavingLaunch] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [editingCreditId, setEditingCreditId] = useState<string | null>(null);
  const [creditDraft, setCreditDraft] = useState("");
  const [savingCreditId, setSavingCreditId] = useState<string | null>(null);
  const [uploadingReviewId, setUploadingReviewId] = useState<string | null>(null);
  const [minimumWithdrawalInr, setMinimumWithdrawalInr] = useState(300);
  const [minimumWithdrawalRange, setMinimumWithdrawalRange] = useState({ min: 100, max: 10_000 });
  const [savingWalletSettings, setSavingWalletSettings] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push("/admin-access"); return; }
      if (userDoc && userDoc.role !== "admin") { router.push("/admin-access"); return; }
    }
  }, [user, userDoc, loading, router]);

  useEffect(() => {
    if (!user || userDoc?.role !== "admin") return;
    const verifySession = async () => {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      if (!response.ok) {
        await logout();
        router.replace("/admin-access?reason=expired");
      }
    };
    const interval = window.setInterval(() => void verifySession(), 4 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [user, userDoc?.role, logout, router]);

  useEffect(() => {
    if (!user || userDoc?.role !== "admin") return;
    const fetchAll = async () => {
      try {
        const token = await user.getIdToken();
        const [celebSnap, userSnap, withdrawalResponse, launchResponse, socialResponse, walletSettingsResponse] = await Promise.all([
          getDocs(query(collection(db, COLLECTIONS.CELEBRATIONS), orderBy("createdAt", "desc"))),
          getDocs(query(collection(db, COLLECTIONS.USERS), orderBy("createdAt", "desc"))),
          fetch("/api/admin/wallet-withdrawals", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/site-launch", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/social-rewards", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/wallet-settings", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setCelebrations(celebSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setUsers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        const withdrawalResult = await withdrawalResponse.json();
        const launchResult = await launchResponse.json();
        const socialResult = await socialResponse.json();
        const walletSettingsResult = await walletSettingsResponse.json();
        if (!launchResponse.ok) throw new Error(launchResult.error || "Unable to load launch settings");
        if (withdrawalResponse.ok) {
          setWithdrawals(Array.isArray(withdrawalResult.requests) ? withdrawalResult.requests : []);
        } else {
          setWithdrawalError(withdrawalResult.error || "Unable to load payouts");
        }
        if (socialResponse.ok) {
          setSocialClaims(Array.isArray(socialResult.claims) ? socialResult.claims : []);
        } else {
          setWithdrawalError(socialResult.error || "Unable to load social rewards");
        }
        if (!walletSettingsResponse.ok) throw new Error(walletSettingsResult.error || "Unable to load wallet settings");
        setMinimumWithdrawalInr(walletSettingsResult.minimumWithdrawalInr);
        if (walletSettingsResult.allowedRange) setMinimumWithdrawalRange(walletSettingsResult.allowedRange);
        setPrelaunchEnabled(launchResult.settings?.prelaunchEnabled === true);
        setLaunchAt(toDatetimeLocal(launchResult.settings?.launchAt ?? null));
        setPrebookOrders(Array.isArray(launchResult.orders) ? launchResult.orders : []);
      } catch (error) {
        setWithdrawalError(error instanceof Error ? error.message : "Unable to load payouts");
      } finally {
        setFetching(false);
      }
    };
    void fetchAll();
  }, [user, userDoc]);

  const secureLogout = async () => {
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } finally {
      await logout();
      router.replace("/admin-access");
    }
  };

  const saveWalletSettings = async () => {
    if (!user) return;
    setSavingWalletSettings(true);
    setWithdrawalError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/wallet-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ minimumWithdrawalInr }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save wallet settings");
      setMinimumWithdrawalInr(result.minimumWithdrawalInr);
    } catch (error) {
      setWithdrawalError(error instanceof Error ? error.message : "Unable to save wallet settings");
    } finally {
      setSavingWalletSettings(false);
    }
  };

  const toggleBlockCelebration = async (id: string, current: boolean) => {
    await updateDoc(doc(db, COLLECTIONS.CELEBRATIONS, id), { isBlocked: !current });
    setCelebrations((cs) => cs.map((c) => c.id === id ? { ...c, isBlocked: !current } : c));
  };

  const toggleBlockUser = async (id: string, current: boolean) => {
    await updateDoc(doc(db, COLLECTIONS.USERS, id), { isBlocked: !current });
    setUsers((us) => us.map((u) => u.id === id ? { ...u, isBlocked: !current } : u));
  };

  const toggleGalleryApproved = async (id: string, current: boolean) => {
    await updateDoc(doc(db, COLLECTIONS.CELEBRATIONS, id), { galleryApproved: !current });
    setCelebrations((cs) => cs.map((c) => c.id === id ? { ...c, galleryApproved: !current } : c));
  };

  const uploadVerifiedReview = async (celebration: any, file: File) => {
    if (!celebration.isPublicOptIn || !celebration.galleryApproved) {
      setWithdrawalError("Feature this opted-in celebration before adding review proof.");
      return;
    }
    const mediaType = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : "";
    const maxBytes = mediaType === "video" ? 30 * 1024 * 1024 : 8 * 1024 * 1024;
    if (!mediaType || file.size > maxBytes) {
      setWithdrawalError(mediaType ? `Review ${mediaType} is too large.` : "Choose an image or video file.");
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = mediaType === "video"
      ? process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      : process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      setWithdrawalError("Cloudinary uploads are not configured.");
      return;
    }

    setUploadingReviewId(celebration.id);
    setWithdrawalError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "birthdayglow/verified-reviews");
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${mediaType}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadResult.secure_url) {
        throw new Error(uploadResult.error?.message ?? "Review media upload failed.");
      }

      await updateDoc(doc(db, COLLECTIONS.CELEBRATIONS, celebration.id), {
        reviewMediaUrl: uploadResult.secure_url,
        reviewMediaType: mediaType,
        reviewVerified: true,
        reviewVerifiedAt: serverTimestamp(),
      });
      setCelebrations((items) => items.map((item) => item.id === celebration.id ? {
        ...item,
        reviewMediaUrl: uploadResult.secure_url,
        reviewMediaType: mediaType,
        reviewVerified: true,
      } : item));
    } catch (error) {
      setWithdrawalError(error instanceof Error ? error.message : "Unable to upload review media.");
    } finally {
      setUploadingReviewId(null);
    }
  };

  const removeVerifiedReview = async (celebrationId: string) => {
    setUploadingReviewId(celebrationId);
    setWithdrawalError("");
    try {
      await updateDoc(doc(db, COLLECTIONS.CELEBRATIONS, celebrationId), {
        reviewMediaUrl: "",
        reviewMediaType: "",
        reviewVerified: false,
        reviewVerifiedAt: serverTimestamp(),
      });
      setCelebrations((items) => items.map((item) => item.id === celebrationId ? {
        ...item,
        reviewMediaUrl: "",
        reviewMediaType: "",
        reviewVerified: false,
      } : item));
    } catch (error) {
      setWithdrawalError(error instanceof Error ? error.message : "Unable to remove review media.");
    } finally {
      setUploadingReviewId(null);
    }
  };

  const editCredit = (celebration: any) => {
    setEditingCreditId(celebration.id);
    setCreditDraft(typeof celebration.creditText === "string" ? celebration.creditText : "");
    setWithdrawalError("");
  };

  const saveCredit = async (celebrationId: string) => {
    const creditText = creditDraft.trim();
    if (creditText.length > 120) {
      setWithdrawalError("Website credit must be 120 characters or fewer");
      return;
    }

    setSavingCreditId(celebrationId);
    setWithdrawalError("");
    try {
      await updateDoc(doc(db, COLLECTIONS.CELEBRATIONS, celebrationId), {
        creditText,
        creditUpdatedAt: serverTimestamp(),
      });
      setCelebrations((items) => items.map((item) => item.id === celebrationId
        ? { ...item, creditText }
        : item));
      setEditingCreditId(null);
      setCreditDraft("");
    } catch (error) {
      setWithdrawalError(error instanceof Error ? error.message : "Unable to save website credit");
    } finally {
      setSavingCreditId(null);
    }
  };

  const processWithdrawal = async (requestId: string, action: "paid" | "rejected") => {
    if (!user) return;
    const note = payoutNotes[requestId]?.trim() ?? "";
    if (note.length < 3) {
      setWithdrawalError(action === "paid" ? "Enter the bank transfer reference" : "Enter a rejection reason");
      return;
    }
    setProcessingWithdrawal(requestId);
    setWithdrawalError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/wallet-withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestId,
          action,
          ...(action === "paid" ? { payoutReference: note } : { rejectionReason: note }),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to process withdrawal");
      setWithdrawals((items) => items.map((item) => item.id === requestId
        ? {
            ...item,
            status: action,
            processedAt: new Date().toISOString(),
            ...(action === "paid" ? { payoutReference: note } : { rejectionReason: note }),
          }
        : item));
      setPayoutNotes((notes) => ({ ...notes, [requestId]: "" }));
    } catch (error) {
      setWithdrawalError(error instanceof Error ? error.message : "Unable to process withdrawal");
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  const processSocialClaim = async (claimId: string, action: "approved" | "rejected") => {
    if (!user) return;
    const rejectionReason = socialReviewNotes[claimId]?.trim() ?? "";
    const instagramPostUrl = socialPostUrls[claimId]?.trim() ?? "";
    if (action === "rejected" && rejectionReason.length < 3) {
      setWithdrawalError("Enter a reason before rejecting social-post proof.");
      return;
    }
    setProcessingSocialClaim(claimId);
    setWithdrawalError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/social-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ claimId, action, rejectionReason, instagramPostUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to review social reward claim.");
      setSocialClaims((claims) => claims.map((claim) => claim.id === claimId ? {
        ...claim,
        status: action,
        reviewedAt: new Date().toISOString(),
        rejectionReason: action === "rejected" ? rejectionReason : "",
        instagramPostUrl: action === "approved" ? instagramPostUrl : "",
      } : claim));
      setSocialReviewNotes((notes) => ({ ...notes, [claimId]: "" }));
      setSocialPostUrls((urls) => ({ ...urls, [claimId]: "" }));
    } catch (error) {
      setWithdrawalError(error instanceof Error ? error.message : "Unable to review social reward claim.");
    } finally {
      setProcessingSocialClaim(null);
    }
  };

  const saveLaunchSettings = async () => {
    if (!user) return;
    if (prelaunchEnabled && !launchAt) {
      setWithdrawalError("Choose the website launch date and time");
      return;
    }
    setSavingLaunch(true);
    setWithdrawalError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/site-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "updateSettings",
          prelaunchEnabled,
          launchAt: launchAt ? new Date(launchAt).toISOString() : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save launch settings");
    } catch (error) {
      setWithdrawalError(error instanceof Error ? error.message : "Unable to save launch settings");
    } finally {
      setSavingLaunch(false);
    }
  };

  const processPrebook = async (orderId: string, status: "accepted" | "rejected") => {
    if (!user) return;
    setProcessingOrder(orderId);
    setWithdrawalError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/site-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "updatePrebook", orderId, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update prebook");
      setPrebookOrders((orders) => orders.map((order) => order.id === orderId ? { ...order, status } : order));
    } catch (error) {
      setWithdrawalError(error instanceof Error ? error.message : "Unable to update prebook");
    } finally {
      setProcessingOrder(null);
    }
  };

  const acceptWithoutPayment = async (celebrationId: string) => {
    if (!user) return;
    setProcessingOrder(celebrationId);
    setWithdrawalError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/activate-celebration", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          celebrationId,
          waivePayment: true,
          reason: "Complimentary order approved from admin dashboard",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to approve order");
      setCelebrations((orders) => orders.map((order) => order.id === celebrationId
        ? { ...order, paymentStatus: "paid", isActive: true, paymentWaived: true, slug: result.slug }
        : order));
    } catch (error) {
      setWithdrawalError(error instanceof Error ? error.message : "Unable to approve order");
    } finally {
      setProcessingOrder(null);
    }
  };

  if (loading || !user || !userDoc) return null;

  const paidCelebrations = celebrations.filter((c) => c.paymentStatus === "paid");
  // Revenue is the sum of each order's actual price: prefer the persisted
  // `pricePaise`, fall back to recomputing from the selected features, and
  // finally to the base package price for very old records.
  const revenueInr = (c: any): number => {
    if (typeof c.pricePaise === "number" && c.pricePaise > 0) return c.pricePaise / 100;
    return computePriceInr(Array.isArray(c.selectedFeatures) ? c.selectedFeatures : []);
  };
  const totalRevenue = paidCelebrations.reduce((sum, c) => sum + revenueInr(c), 0);
  const today = new Date();
  const todayRevenue = paidCelebrations
    .filter((c) => {
      const d = c.createdAt?.toDate?.();
      return d && d.toDateString() === today.toDateString();
    })
    .reduce((sum, c) => sum + revenueInr(c), 0);
  const pendingWithdrawals = withdrawals.filter((withdrawal) => withdrawal.status === "pending");
  const pendingSocialClaims = socialClaims.filter((claim) => claim.status === "pending");

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
      <nav className="sticky top-0 z-50 border-b border-emerald-300/10 px-5 py-3" style={{ background: "rgba(7,12,16,0.94)", backdropFilter: "blur(18px)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-300 text-[#07120d]"><Shield size={18} /></span>
            <div><span className="block font-bold text-white">Control Center</span><span className="hidden text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-emerald-300/70 sm:block">Server-verified Admin session</span></div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/55 hover:text-white"><LayoutDashboard size={14} /><span className="hidden sm:inline">Customer dashboard</span></Link>
            <button type="button" onClick={() => void secureLogout()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-3 text-xs font-semibold text-rose-200 hover:bg-rose-400/10"><LogOut size={14} /><span className="hidden sm:inline">Secure sign out</span></button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[
            { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: <DollarSign size={20} />, color: "#22c55e" },
            { label: "Today Revenue", value: `₹${todayRevenue}`, icon: <TrendingUp size={20} />, color: "#f59e0b" },
            { label: "Total Orders", value: celebrations.length + prebookOrders.length, icon: <Globe size={20} />, color: "#a855f7" },
            { label: "Total Users", value: users.length, icon: <Users size={20} />, color: "#ec4899" },
            { label: "Pending Payouts", value: pendingWithdrawals.length, icon: <Landmark size={20} />, color: "#22c55e" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-5">
              <div style={{ color: s.color }} className="mb-2">{s.icon}</div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex gap-1 overflow-x-auto rounded-lg border border-white/8 bg-white/[0.025] p-1">
          {(["overview", "orders", "launch", "users", "payouts", "social"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold capitalize transition-all ${tab === t ? "bg-emerald-300 text-[#07120d]" : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-white"}`}>
              {t}
            </button>
          ))}
          </div>
          <div className="relative lg:ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders or users" className="input-field w-full py-2 pl-9 text-sm lg:w-56" />
          </div>
        </div>

        {withdrawalError && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {withdrawalError}
          </div>
        )}

        {tab === "launch" && (
          <div className="space-y-6">
            <section className="glass-card p-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-amber-300"><CalendarClock size={18} /><h2 className="font-semibold text-white">Website launch</h2></div>
                  <p className="max-w-xl text-sm text-[var(--text-muted)]">When enabled, the home page shows the launch timer and prebook form until this time.</p>
                </div>
                <label className="flex items-center gap-3 text-sm font-semibold">
                  <input type="checkbox" checked={prelaunchEnabled} onChange={(event) => setPrelaunchEnabled(event.target.checked)} className="h-4 w-4 accent-amber-400" />
                  Enable prelaunch mode
                </label>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input type="datetime-local" value={launchAt} onChange={(event) => setLaunchAt(event.target.value)} className="input-field py-2.5 text-sm sm:w-72" />
                <button type="button" onClick={() => void saveLaunchSettings()} disabled={savingLaunch} className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/25 disabled:opacity-50">
                  {savingLaunch ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} Save launch settings
                </button>
              </div>
            </section>

            <section className="glass-card overflow-hidden">
              <div className="border-b border-purple-500/10 p-4">
                <h2 className="font-semibold">Prebook orders</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">New requests are also emailed to info@novantixtech.com.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-purple-500/10 bg-white/[0.02]">{["Customer", "Contact", "Occasion", "Notes", "Date", "Status", "Action"].map((heading) => <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">{heading}</th>)}</tr></thead>
                  <tbody>
                    {prebookOrders.map((order) => (
                      <tr key={order.id} className="border-b border-purple-500/5 align-top">
                        <td className="px-4 py-3 font-medium">{order.name}</td>
                        <td className="px-4 py-3 text-xs"><div className="flex items-center gap-1"><Mail size={11} />{order.email}</div><div className="mt-1 flex items-center gap-1 text-[var(--text-muted)]"><Phone size={11} />{order.phone}</div></td>
                        <td className="px-4 py-3">{order.occasion}</td>
                        <td className="max-w-56 px-4 py-3 text-xs text-[var(--text-muted)]">{order.message || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-muted)]">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="px-4 py-3"><span className={order.status === "accepted" ? "text-green-400" : order.status === "rejected" ? "text-red-400" : "text-amber-300"}>{order.status}</span></td>
                        <td className="px-4 py-3">
                          {order.status === "pending" ? <div className="flex gap-2">
                            <button disabled={processingOrder === order.id} onClick={() => void processPrebook(order.id, "accepted")} className="rounded bg-green-500/10 px-2.5 py-1.5 text-xs font-semibold text-green-300 disabled:opacity-50">Accept free</button>
                            <button disabled={processingOrder === order.id} onClick={() => void processPrebook(order.id, "rejected")} className="rounded bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-300 disabled:opacity-50">Reject</button>
                          </div> : <span className="text-xs text-[var(--text-muted)]">Processed</span>}
                        </td>
                      </tr>
                    ))}
                    {!fetching && prebookOrders.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">No prebook orders yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {tab === "payouts" && (
          <div className="glass-card overflow-hidden mb-6">
            <div className="p-4 border-b border-purple-500/10 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Wallet Payouts</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">Transfer through your bank, then record the reference here.</p>
              </div>
              <span className="text-xs font-semibold text-amber-300">{pendingWithdrawals.length} pending</span>
            </div>
            <div className="flex flex-col gap-4 border-b border-white/10 bg-emerald-300/[0.035] p-4 sm:flex-row sm:items-end sm:justify-between">
              <div><div className="flex items-center gap-2 text-sm font-semibold text-white"><Settings2 size={16} className="text-emerald-300" /> Bank withdrawal threshold</div><p className="mt-1 text-xs text-[var(--text-muted)]">Applies immediately to new withdrawal requests. Allowed range: ₹{minimumWithdrawalRange.min.toLocaleString("en-IN")}–₹{minimumWithdrawalRange.max.toLocaleString("en-IN")}.</p></div>
              <div className="flex gap-2"><label className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">₹</span><input type="number" min={minimumWithdrawalRange.min} max={minimumWithdrawalRange.max} step="1" value={minimumWithdrawalInr} onChange={(event) => setMinimumWithdrawalInr(Number(event.target.value))} className="input-field w-36 py-2 pl-7 text-sm" aria-label="Minimum bank withdrawal" /></label><button type="button" onClick={() => void saveWalletSettings()} disabled={savingWalletSettings} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-300 px-4 text-sm font-bold text-[#07120d] disabled:opacity-50">{savingWalletSettings ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} Save</button></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-500/10" style={{ background: "rgba(168,85,247,0.05)" }}>
                    {["User", "Amount", "Bank details", "Requested", "Status", "Action"].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-left text-xs text-[var(--text-muted)] font-medium">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-purple-500/5 align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium">{withdrawal.accountHolderName}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{withdrawal.userEmail}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-green-400">₹{withdrawal.amountInr}</td>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                        <div>{withdrawal.accountNumber}</div>
                        <div className="text-[var(--text-muted)] mt-1">{withdrawal.ifsc}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                        {withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs capitalize ${withdrawal.status === "paid" ? "text-green-400" : withdrawal.status === "rejected" ? "text-red-400" : "text-amber-300"}`}>
                          {withdrawal.status === "paid" ? <CheckCircle size={13} /> : withdrawal.status === "rejected" ? <XCircle size={13} /> : <LoaderCircle size={13} />}
                          {withdrawal.status}
                        </span>
                        {withdrawal.payoutReference && <div className="text-xs text-green-300 mt-1">Ref: {withdrawal.payoutReference}</div>}
                        {withdrawal.rejectionReason && <div className="text-xs text-red-300 mt-1">{withdrawal.rejectionReason}</div>}
                      </td>
                      <td className="px-4 py-3 min-w-64">
                        {withdrawal.status === "pending" ? (
                          <div className="space-y-2">
                            <input
                              value={payoutNotes[withdrawal.id] ?? ""}
                              onChange={(event) => setPayoutNotes((notes) => ({ ...notes, [withdrawal.id]: event.target.value }))}
                              placeholder="Transfer ref / rejection reason"
                              className="input-field py-1.5 text-xs w-full"
                            />
                            <div className="flex gap-2">
                              <button type="button" disabled={processingWithdrawal === withdrawal.id} onClick={() => void processWithdrawal(withdrawal.id, "paid")} className="px-2.5 py-1.5 rounded text-xs font-semibold text-green-300 bg-green-500/10 disabled:opacity-50">
                                Mark paid
                              </button>
                              <button type="button" disabled={processingWithdrawal === withdrawal.id} onClick={() => void processWithdrawal(withdrawal.id, "rejected")} className="px-2.5 py-1.5 rounded text-xs font-semibold text-red-300 bg-red-500/10 disabled:opacity-50">
                                Reject & refund
                              </button>
                            </div>
                          </div>
                        ) : <span className="text-xs text-[var(--text-muted)]">Processed</span>}
                      </td>
                    </tr>
                  ))}
                  {!fetching && withdrawals.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--text-muted)]">No payout requests yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "social" && (
          <div className="glass-card mb-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-purple-500/10 p-4">
              <div>
                <h2 className="font-semibold">Social reward verification</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Find the reaction DM by Instagram username, publish or verify it, then attach the public post URL before releasing ₹30.</p>
              </div>
              <span className="text-xs font-semibold text-amber-300">{pendingSocialClaims.length} pending</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-purple-500/10 bg-white/[0.02]">{["Creator", "Surprise", "Instagram", "Published post", "Submitted", "Status", "Action"].map((heading) => <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">{heading}</th>)}</tr></thead>
                <tbody>
                  {socialClaims.map((claim) => (
                    <tr key={claim.id} className="border-b border-purple-500/5 align-top">
                      <td className="px-4 py-3 text-xs">{claim.userEmail || "Unknown creator"}</td>
                      <td className="px-4 py-3 font-medium">{claim.recipientName}</td>
                      <td className="px-4 py-3">
                        <a href={`https://www.instagram.com/${claim.instagramHandle}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-pink-300"><ExternalLink size={11} /> @{claim.instagramHandle}</a>
                      </td>
                      <td className="px-4 py-3">
                        {claim.instagramPostUrl ? <a href={claim.instagramPostUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300"><ExternalLink size={11} /> View post</a> : <span className="text-xs text-white/30">Not added</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--text-muted)]">{claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={claim.status === "approved" ? "text-green-400" : claim.status === "rejected" ? "text-red-400" : "text-amber-300"}>{claim.status}</span>
                        {claim.status === "approved" && <div className="mt-1 text-xs text-green-300">₹{claim.rewardInr} credited</div>}
                        {claim.rejectionReason && <div className="mt-1 max-w-48 text-xs text-red-300">{claim.rejectionReason}</div>}
                      </td>
                      <td className="min-w-64 px-4 py-3">
                        {claim.status === "pending" ? (
                          <div className="space-y-2">
                            <input value={socialPostUrls[claim.id] ?? ""} onChange={(event) => setSocialPostUrls((urls) => ({ ...urls, [claim.id]: event.target.value }))} placeholder="https://instagram.com/reel/..." className="input-field w-full py-1.5 text-xs" />
                            <input value={socialReviewNotes[claim.id] ?? ""} onChange={(event) => setSocialReviewNotes((notes) => ({ ...notes, [claim.id]: event.target.value }))} placeholder="Rejection reason if needed" className="input-field w-full py-1.5 text-xs" />
                            <div className="flex gap-2">
                              <button type="button" disabled={processingSocialClaim === claim.id} onClick={() => void processSocialClaim(claim.id, "approved")} className="rounded bg-green-500/10 px-2.5 py-1.5 text-xs font-semibold text-green-300 disabled:opacity-50">Approve ₹{claim.rewardInr}</button>
                              <button type="button" disabled={processingSocialClaim === claim.id} onClick={() => void processSocialClaim(claim.id, "rejected")} className="rounded bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-300 disabled:opacity-50">Reject</button>
                            </div>
                          </div>
                        ) : <span className="text-xs text-[var(--text-muted)]">Processed</span>}
                      </td>
                    </tr>
                  ))}
                  {!fetching && socialClaims.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">No social reward claims yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                      <td className="px-4 py-3 font-medium">
                        <div>{c.recipientName}</div>
                        {c.creditText && <div className="mt-1 max-w-48 truncate text-xs font-normal text-amber-200/80">{c.creditText}</div>}
                      </td>
                      <td className="px-4 py-3 text-purple-400 font-mono text-xs">{c.slug || "—"}</td>
                      <td className="px-4 py-3 capitalize">{c.theme}</td>
                      <td className="px-4 py-3">{c.photos?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.paymentStatus === "paid" ? "text-green-400" : "text-yellow-400"}`}
                          style={{ background: c.paymentStatus === "paid" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)" }}>
                          {c.paymentWaived ? "complimentary" : c.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex items-center gap-1">
                        <Eye size={12} className="text-[var(--text-muted)]" /> {c.views ?? 0}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                        {c.createdAt?.toDate?.()?.toLocaleDateString("en-IN") ?? "—"}
                      </td>
                      <td className="min-w-80 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleBlockCelebration(c.id, c.isBlocked)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${c.isBlocked ? "text-green-400" : "text-red-400"}`}
                            style={{ background: c.isBlocked ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
                            {c.isBlocked ? <><CheckCircle size={11} /> Unblock</> : <><Ban size={11} /> Block</>}
                          </button>
                          {c.paymentStatus !== "paid" && (
                            <button disabled={processingOrder === c.id} onClick={() => void acceptWithoutPayment(c.id)} className="flex items-center gap-1 rounded bg-green-500/10 px-2 py-1 text-xs font-medium text-green-300 transition hover:bg-green-500/20 disabled:opacity-50">
                              {processingOrder === c.id ? <LoaderCircle size={11} className="animate-spin" /> : <Gift size={11} />} Accept free
                            </button>
                          )}
                          {c.isPublicOptIn && (
                            <button onClick={() => toggleGalleryApproved(c.id, c.galleryApproved)}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${c.galleryApproved ? "text-amber-300" : "text-[var(--text-muted)]"}`}
                              style={{ background: c.galleryApproved ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.05)" }}
                              title="Feature on the public Wall of Love">
                              💛 {c.galleryApproved ? "Featured" : "Feature"}
                            </button>
                          )}
                          {c.isPublicOptIn && c.galleryApproved && (
                            <label className="flex cursor-pointer items-center gap-1 rounded bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20">
                              {uploadingReviewId === c.id ? <LoaderCircle size={11} className="animate-spin" /> : c.reviewVerified ? <BadgeCheck size={11} /> : <Upload size={11} />}
                              {c.reviewVerified ? "Replace proof" : "Add review proof"}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                                className="sr-only"
                                disabled={uploadingReviewId === c.id}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) void uploadVerifiedReview(c, file);
                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>
                          )}
                          {c.reviewVerified && c.reviewMediaUrl && (
                            <>
                              <a href={c.reviewMediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded bg-white/5 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-white">
                                <Eye size={11} /> Proof
                              </a>
                              <button type="button" onClick={() => void removeVerifiedReview(c.id)} disabled={uploadingReviewId === c.id} className="flex items-center gap-1 rounded bg-red-500/10 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/20 disabled:opacity-50" title="Remove verified review media">
                                <Trash2 size={11} /> Remove proof
                              </button>
                            </>
                          )}
                          <button type="button" onClick={() => editCredit(c)}
                            className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20">
                            <PencilLine size={11} /> {c.creditText ? "Edit credit" : "Add credit"}
                          </button>
                        </div>
                        {editingCreditId === c.id && (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              value={creditDraft}
                              onChange={(event) => setCreditDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") void saveCredit(c.id);
                                if (event.key === "Escape") setEditingCreditId(null);
                              }}
                              maxLength={120}
                              autoFocus
                              placeholder="Created with love by..."
                              aria-label={`Credit for ${c.recipientName}`}
                              className="input-field min-w-0 flex-1 py-1.5 text-xs"
                            />
                            <button type="button" onClick={() => void saveCredit(c.id)} disabled={savingCreditId === c.id}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-green-500/10 text-green-300 transition hover:bg-green-500/20 disabled:opacity-50"
                              title="Save credit" aria-label="Save credit">
                              {savingCreditId === c.id ? <LoaderCircle size={13} className="animate-spin" /> : <Save size={13} />}
                            </button>
                            <button type="button" onClick={() => setEditingCreditId(null)} disabled={savingCreditId === c.id}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white/5 text-[var(--text-muted)] transition hover:text-white disabled:opacity-50"
                              title="Cancel editing" aria-label="Cancel editing">
                              <XCircle size={13} />
                            </button>
                          </div>
                        )}
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
