import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

// BUG-09: The original code called getAdminApp() immediately at module load
// ("export const adminDb = getFirestore(getAdminApp())"), which caused `next build`
// to throw when Firebase env vars were absent in CI environments.
//
// Fix: apply the same lazy-proxy pattern used in apps/web/lib/firebase-admin.ts
// so the Admin SDK is only initialised on the first actual Firestore access, not
// at import time.

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    // Only allow a dummy app during `next build` static analysis.
    // At runtime (page renders, API calls), missing vars must throw.
    const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
    if (!isBuildPhase) {
      throw new Error(
        "[birthday/firebase-admin] FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or " +
          "FIREBASE_PRIVATE_KEY are missing at runtime. Set these in your deployment."
      );
    }
    console.warn(
      "[birthday/firebase-admin] Missing env vars during build phase — using dummy config (build only)."
    );
    adminApp = initializeApp({ projectId: "dummy-project-id" });
    return adminApp;
  }

  let formattedKey = privateKey.trim();
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1);
  }
  if (formattedKey.startsWith("'") && formattedKey.endsWith("'")) {
    formattedKey = formattedKey.slice(1, -1);
  }
  formattedKey = formattedKey.replace(/\\n/g, "\n");

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: formattedKey,
    }),
  });
  return adminApp;
}

function assertRealApp(): void {
  const app = getAdminApp();
  if (app.options.projectId === "dummy-project-id") {
    throw new Error(
      "[birthday/firebase-admin] Attempted to use Firestore with a dummy build-time app. " +
        "Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
    );
  }
}

let _adminDb: any = null;

// Lazy proxy — SDK is initialised only on first access, not at import time.
export const adminDb = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (!_adminDb) {
      assertRealApp();
      _adminDb = getFirestore(getAdminApp());
    }
    return Reflect.get(_adminDb, prop, receiver);
  },
}) as ReturnType<typeof getFirestore>;
