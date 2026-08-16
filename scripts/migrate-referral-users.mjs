import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { Timestamp, getFirestore } from "firebase-admin/firestore";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { loadEnvConfig } = nextEnv;
loadEnvConfig(path.join(root, "apps", "web"));

const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
  throw new Error("Firebase Admin credentials are not configured in apps/web/.env.local");
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

function referralCodeFor(uid) {
  const clean = uid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `J4Y${clean.padEnd(10, "0").slice(0, 10)}`;
}

function normalizeReferralCode(code) {
  const normalized = typeof code === "string" ? code.trim().toUpperCase() : "";
  return /^J4Y[A-Z0-9]{10}$/.test(normalized) ? normalized : null;
}

const auth = getAuth();
const db = getFirestore();
let pageToken;
let created = 0;
let updated = 0;

do {
  const page = await auth.listUsers(1000, pageToken);
  const refs = page.users.map((user) => db.collection("users").doc(user.uid));
  const existing = refs.length > 0 ? await db.getAll(...refs) : [];
  const batch = db.batch();

  page.users.forEach((user, index) => {
    const current = existing[index]?.data();
    const base = {
      uid: user.uid,
      email: user.email ?? current?.email ?? "",
      name: user.displayName ?? current?.name ?? user.email?.split("@")[0] ?? "User",
      referralCode: normalizeReferralCode(current?.referralCode) || referralCodeFor(user.uid),
      walletBalance: Math.max(0, Number(current?.walletBalance ?? current?.referralCredits) || 0),
    };
    if (current) {
      batch.set(refs[index], base, { merge: true });
      updated += 1;
    } else {
      batch.create(refs[index], {
        ...base,
        ...(user.photoURL ? { photoURL: user.photoURL } : {}),
        role: user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? "admin" : "user",
        isBlocked: false,
        referralCredits: 0,
        walletBalance: 0,
        referralJoinBonusGranted: false,
        referralCount: 0,
        freeAddonCredits: 0,
        createdAt: user.metadata.creationTime
          ? Timestamp.fromDate(new Date(user.metadata.creationTime))
          : Timestamp.now(),
      });
      created += 1;
    }
  });

  if (page.users.length > 0) await batch.commit();
  pageToken = page.pageToken;
} while (pageToken);

console.log(JSON.stringify({ created, updated, total: created + updated }, null, 2));