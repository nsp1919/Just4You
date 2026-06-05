import { initializeApp, getApps, cert, App, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let adminApp: App;
let _usingDummy = false;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  // ── Method 1: Full service account JSON (RECOMMENDED for Hostinger) ──────────
  // Set FIREBASE_SERVICE_ACCOUNT_JSON to the entire contents of your
  // serviceAccountKey.json file. JSON.parse handles all escaping automatically.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
      _usingDummy = false;
      adminApp = initializeApp({ credential: cert(serviceAccount) });
      return adminApp;
    } catch (err: any) {
      if (!isBuildPhase) {
        throw new Error(`[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${err.message}`);
      }
    }
  }

  // ── Method 2: Individual env vars (fallback) ───────────────────────────────
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    if (!isBuildPhase) {
      throw new Error(
        "[firebase-admin] Missing credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON " +
          "(preferred) or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY."
      );
    }
    console.warn("[firebase-admin] Missing env vars during build phase — using dummy config.");
    _usingDummy = true;
    adminApp = initializeApp({ projectId: "dummy-project-id" });
    return adminApp;
  }

  // Clean up the private key — strip any surrounding quotes/whitespace and
  // unescape literal \n sequences that hosting platforms sometimes introduce.
  let formattedKey = privateKey.trim();
  while (formattedKey.startsWith('"') || formattedKey.startsWith("'")) {
    formattedKey = formattedKey.slice(1).trim();
  }
  while (formattedKey.endsWith('"') || formattedKey.endsWith("'") || formattedKey.endsWith("\\")) {
    formattedKey = formattedKey.slice(0, -1).trim();
  }
  // Replace literal \n with real newlines
  formattedKey = formattedKey.replace(/\\n/g, "\n").trim();

  _usingDummy = false;
  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey: formattedKey }),
  });
  return adminApp;
}

function assertRealApp(): void {
  const app = getAdminApp();
  if (_usingDummy || app.options.projectId === "dummy-project-id") {
    throw new Error(
      "[firebase-admin] Attempted to use Firebase services with a dummy app. " +
        "Set FIREBASE_SERVICE_ACCOUNT_JSON or individual Firebase env vars in your deployment."
    );
  }
}

let _adminDb: any = null;
let _adminAuth: any = null;

export const adminDb = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (!_adminDb) {
      assertRealApp();
      _adminDb = getFirestore(getAdminApp());
    }
    return Reflect.get(_adminDb, prop, receiver);
  },
}) as ReturnType<typeof getFirestore>;

export const adminAuth = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (!_adminAuth) {
      assertRealApp();
      _adminAuth = getAuth(getAdminApp());
    }
    return Reflect.get(_adminAuth, prop, receiver);
  },
}) as ReturnType<typeof getAuth>;
