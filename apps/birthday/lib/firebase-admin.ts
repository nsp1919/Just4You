import { initializeApp, getApps, cert, App, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  // ── Method 1: Base64-encoded service account (MOST RELIABLE for Hostinger) ──
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (serviceAccountB64) {
    try {
      const json = Buffer.from(serviceAccountB64.trim(), "base64").toString("utf-8");
      const serviceAccount: ServiceAccount = JSON.parse(json);
      adminApp = initializeApp({ credential: cert(serviceAccount) });
      return adminApp;
    } catch (err: any) {
      if (!isBuildPhase) {
        throw new Error(`[birthday/firebase-admin] Failed to decode FIREBASE_SERVICE_ACCOUNT_B64: ${err.message}`);
      }
    }
  }

  // ── Method 2: Plain JSON service account ──────────────────────────────────
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      let jsonStr = serviceAccountJson.trim();
      while ((jsonStr.startsWith('"') && jsonStr.endsWith('"')) ||
             (jsonStr.startsWith("'") && jsonStr.endsWith("'"))) {
        jsonStr = jsonStr.slice(1, -1).trim();
      }
      if (jsonStr.startsWith('\\"')) jsonStr = jsonStr.slice(2);
      if (jsonStr.endsWith('\\"')) jsonStr = jsonStr.slice(0, -2);
      const serviceAccount: ServiceAccount = JSON.parse(jsonStr);
      adminApp = initializeApp({ credential: cert(serviceAccount) });
      return adminApp;
    } catch (err: any) {
      if (!isBuildPhase) {
        throw new Error(`[birthday/firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${err.message}`);
      }
    }
  }

  // ── Method 3: Individual env vars (last resort) ────────────────────────────
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    if (!isBuildPhase) {
      throw new Error(
        "[birthday/firebase-admin] Missing credentials. Set FIREBASE_SERVICE_ACCOUNT_B64 " +
          "(preferred) or individual Firebase env vars."
      );
    }
    console.warn("[birthday/firebase-admin] Missing env vars during build — using dummy config.");
    adminApp = initializeApp({ projectId: "dummy-project-id" });
    return adminApp;
  }

  let formattedKey = privateKey.trim();
  while (formattedKey.startsWith('"') || formattedKey.startsWith("'")) {
    formattedKey = formattedKey.slice(1).trim();
  }
  while (formattedKey.endsWith('"') || formattedKey.endsWith("'") || formattedKey.endsWith("\\")) {
    formattedKey = formattedKey.slice(0, -1).trim();
  }
  formattedKey = formattedKey.replace(/\\n/g, "\n").trim();

  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey: formattedKey }),
  });
  return adminApp;
}

function assertRealApp(): void {
  const app = getAdminApp();
  if (app.options.projectId === "dummy-project-id") {
    throw new Error(
      "[birthday/firebase-admin] Attempted to use Firestore with a dummy build-time app. " +
        "Set FIREBASE_SERVICE_ACCOUNT_B64 in your deployment."
    );
  }
}

let _adminDb: any = null;

export const adminDb = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (!_adminDb) {
      assertRealApp();
      _adminDb = getFirestore(getAdminApp());
    }
    return Reflect.get(_adminDb, prop, receiver);
  },
}) as ReturnType<typeof getFirestore>;
