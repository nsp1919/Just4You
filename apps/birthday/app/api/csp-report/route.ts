import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_REPORT_BYTES = 16 * 1024;

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REPORT_BYTES) return new NextResponse(null, { status: 413 });

  const rawReport = await request.text();
  if (rawReport.length > MAX_REPORT_BYTES) return new NextResponse(null, { status: 413 });
  try {
    const payload = JSON.parse(rawReport) as Record<string, unknown>;
    const report = (payload["csp-report"] ?? payload) as Record<string, unknown>;
    console.warn("csp-report", {
      documentUri: String(report["document-uri"] ?? "").slice(0, 500),
      violatedDirective: String(report["violated-directive"] ?? "").slice(0, 200),
      blockedUri: String(report["blocked-uri"] ?? "").slice(0, 500),
      disposition: String(report.disposition ?? "report"),
    });
  } catch {
    // Browsers may send legacy report formats; malformed reports are ignored.
  }
  return new NextResponse(null, { status: 204 });
}