import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let adminApp: App;
let _usingDummy = false;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    // Only allow a dummy initialisation during `next build` (static analysis phase).
    // At runtime (API routes, SSR), NEXT_PHASE is not set — throw to prevent silent
    // data corruption against "dummy-project-id". (BUG-02 fix)
    const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
    if (!isBuildPhase) {
      throw new Error(
        "[firebase-admin] FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY " +
          "are missing at runtime. Set these environment variables in your deployment."
      );
    }
    console.warn(
      "[firebase-admin] Missing env vars during build phase — using dummy config (build only)."
    );
    _usingDummy = true;
    adminApp = initializeApp({ projectId: "dummy-project-id" });
    return adminApp;
  }

  _usingDummy = false;
  
  let formattedKey = privateKey.trim();
  while (formattedKey.startsWith('"') || formattedKey.startsWith("'")) {
    formattedKey = formattedKey.slice(1).trim();
  }
  while (formattedKey.endsWith('"') || formattedKey.endsWith("'")) {
    formattedKey = formattedKey.slice(0, -1).trim();
  }
  formattedKey = formattedKey.replace(/\\n/g, "\n").trim();

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
    });
  } catch (err: any) {
    throw new Error(
      `Failed to parse private key. Diagnostics: length=${privateKey.length}, ` +
      `formattedLength=${formattedKey.length}, ` +
      `startsWithDash=${formattedKey.startsWith("-")}, ` +
      `endsWithDash=${formattedKey.endsWith("-")}, ` +
      `hasSlashN=${formattedKey.includes("\\n")}, ` +
      `hasRealNL=${formattedKey.includes("\n")}, ` +
      `prefix="${formattedKey.substring(0, 25)}", ` +
      `suffix="${formattedKey.substring(formattedKey.length - 25)}". ` +
      `Original: ${err.message}`
    );
  }
  return adminApp;
}

/**
 * Throws if the Admin SDK was initialised with a build-time dummy project.
 * Called inside each proxy before the real SDK instance is created so that
 * any runtime call without proper credentials fails immediately with a clear
 * error instead of silently touching "dummy-project-id".
 */
function assertRealApp(): void {
  // Force initialisation so we can inspect the result.
  const app = getAdminApp();
  if (_usingDummy || app.options.projectId === "dummy-project-id") {
    throw new Error(
      "[firebase-admin] Attempted to use Firebase services with a dummy app. " +
        "Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
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
