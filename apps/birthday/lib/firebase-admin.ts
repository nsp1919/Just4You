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

  // Resilience: a base64 service account intended for FIREBASE_SERVICE_ACCOUNT_B64
  // can end up inside FIREBASE_PRIVATE_KEY when a host env UI renames/mangles it.
  // Decode and use it directly if any credential value holds such a blob.
  const salvaged =
    decodeB64ServiceAccount(privateKey) ||
    decodeB64ServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT) ||
    decodeB64ServiceAccount(clientEmail);
  if (salvaged) {
    adminApp = initializeApp({ credential: cert(salvaged) });
    return adminApp;
  }

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

  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey: normalizePrivateKey(privateKey) }),
  });
  return adminApp;
}

/**
 * Detect and decode a base64-encoded service-account JSON from a raw env value.
 * Returns the parsed ServiceAccount, or null if the value isn't a base64 blob
 * decoding to a valid service account. Makes init resilient to host env UIs
 * that rename FIREBASE_SERVICE_ACCOUNT_B64 into another field.
 */
function decodeB64ServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw) return null;
  let s = raw.trim();
  while (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  if (s.includes("BEGIN") || s.startsWith("{")) return null;
  const compact = s.replace(/\s+/g, "");
  if (compact.length < 200 || !/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) return null;
  try {
    const json = Buffer.from(compact, "base64").toString("utf-8");
    const obj = JSON.parse(json);
    if (obj && obj.private_key && obj.client_email && obj.project_id) {
      return obj as ServiceAccount;
    }
  } catch {
    // Not a base64-encoded service account — fall through.
  }
  return null;
}

/**
 * Reconstruct a PEM private key whose newlines were stripped or flattened by a
 * host's env storage. Handles literal "\n" escapes, real newlines, and bodies
 * where newlines were replaced by spaces (re-wrapping base64 at 64 chars).
 */
function normalizePrivateKey(raw: string): string {
  let k = raw.trim();
  while (k.startsWith('"') || k.startsWith("'")) k = k.slice(1).trim();
  while (k.endsWith('"') || k.endsWith("'") || k.endsWith("\\")) k = k.slice(0, -1).trim();
  k = k.replace(/\\n/g, "\n").trim();
  if (k.includes("\n")) return k;
  const header = k.match(/-----BEGIN [^-]+-----/)?.[0];
  const footer = k.match(/-----END [^-]+-----/)?.[0];
  if (header && footer) {
    const body = k.slice(k.indexOf(header) + header.length, k.indexOf(footer)).replace(/\s+/g, "");
    const wrapped = body.match(/.{1,64}/g)?.join("\n") ?? body;
    return `${header}\n${wrapped}\n${footer}\n`;
  }
  return k;
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
