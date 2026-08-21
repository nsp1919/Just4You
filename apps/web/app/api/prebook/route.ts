import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

const ORDER_EMAIL = "info@novantixtech.com";

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (clean(body.website, 100)) return NextResponse.json({ success: true });

    const launchSnapshot = await adminDb.collection(COLLECTIONS.APP_CONFIG).doc("siteLaunch").get();
    const launchSettings = launchSnapshot.data();
    const launchAt = launchSettings?.launchAt?.toDate?.() as Date | undefined;
    if (launchSettings?.prelaunchEnabled !== true || !launchAt || launchAt.getTime() <= Timestamp.now().toMillis()) {
      return NextResponse.json({ error: "Prebooking is closed" }, { status: 409 });
    }

    const name = clean(body.name, 80);
    const email = clean(body.email, 160).toLowerCase();
    const phone = clean(body.phone, 30);
    const occasion = clean(body.occasion, 60);
    const message = clean(body.message, 500);

    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || phone.length < 7 || !occasion) {
      return NextResponse.json({ error: "Enter your name, email, phone number and occasion" }, { status: 400 });
    }

    const orderRef = await adminDb.collection(COLLECTIONS.PREBOOK_ORDERS).add({
      name,
      email,
      phone,
      occasion,
      message,
      status: "pending",
      source: "prelaunch_countdown",
      createdAt: Timestamp.now(),
    });

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    let emailSent = false;
    if (resendKey && fromEmail) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: fromEmail,
          to: ORDER_EMAIL,
          replyTo: email,
          subject: `New Just4You prebook: ${occasion} for ${name}`,
          html: `<h2>New prebook order</h2><p><strong>Order:</strong> ${orderRef.id}</p><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Phone:</strong> ${escapeHtml(phone)}</p><p><strong>Occasion:</strong> ${escapeHtml(occasion)}</p><p><strong>Notes:</strong> ${escapeHtml(message || "None")}</p>`,
        });
        emailSent = true;
      } catch (emailError) {
        console.error("prebook: admin notification failed", emailError);
      }
    }

    return NextResponse.json({ success: true, orderId: orderRef.id, emailSent });
  } catch (error) {
    console.error("prebook error:", error);
    return NextResponse.json({ error: "Unable to place your prebook right now" }, { status: 500 });
  }
}