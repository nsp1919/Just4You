import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  isBotUserAgent,
  VIEW_COOKIE_MAX_AGE_SECONDS,
  viewCookieName,
  viewSourceFromReferrer,
} from "@/lib/view-tracking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

interface ViewRequestBody {
  viewId?: unknown;
  referrer?: unknown;
}

function jsonWithViewCookie(slug: string, counted: boolean): NextResponse {
  const response = NextResponse.json({ counted });
  response.cookies.set(viewCookieName(slug), "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VIEW_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  if (!/^[a-z0-9_-]{3,120}$/i.test(slug)) {
    return NextResponse.json({ error: "Invalid celebration" }, { status: 400 });
  }

  if (request.cookies.has(viewCookieName(slug))) {
    return NextResponse.json({ counted: false });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBotUserAgent(userAgent)) {
    return NextResponse.json({ counted: false });
  }

  const body = await request.json().catch(() => ({})) as ViewRequestBody;
  const viewId = typeof body.viewId === "string" ? body.viewId : "";
  if (!/^[0-9a-f-]{36}$/i.test(viewId)) {
    return NextResponse.json({ error: "Invalid view request" }, { status: 400 });
  }

  const celebrationQuery = await adminDb
    .collection("celebrations")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (celebrationQuery.empty) {
    return NextResponse.json({ error: "Celebration not found" }, { status: 404 });
  }

  const celebrationRef = celebrationQuery.docs[0].ref;
  const viewLogRef = celebrationRef.collection("viewLog").doc(viewId);
  const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 2048) : "";
  const userAgentLower = userAgent.toLowerCase();
  const device = /mobile|iphone|android|ipad/.test(userAgentLower)
    ? "mobile"
    : /tablet/.test(userAgentLower)
      ? "tablet"
      : "desktop";
  const cityHeader = request.headers.get("x-vercel-ip-city") || "";
  const country = request.headers.get("x-vercel-ip-country") || "";
  let city = "";
  try {
    city = cityHeader ? decodeURIComponent(cityHeader) : "";
  } catch {
    city = cityHeader.slice(0, 120);
  }

  const counted = await adminDb.runTransaction(async (transaction) => {
    const [celebration, existingView] = await Promise.all([
      transaction.get(celebrationRef),
      transaction.get(viewLogRef),
    ]);

    if (!celebration.exists || celebration.data()?.isActive !== true || celebration.data()?.isBlocked === true) {
      return false;
    }
    if (existingView.exists) return false;

    transaction.update(celebrationRef, { views: FieldValue.increment(1) });
    transaction.set(viewLogRef, {
      ts: FieldValue.serverTimestamp(),
      device,
      ref: viewSourceFromReferrer(referrer),
      city,
      country,
    });
    return true;
  });

  return jsonWithViewCookie(slug, counted);
}