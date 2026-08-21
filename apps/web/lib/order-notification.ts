import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

const ORDER_EMAIL = "info@novantixtech.com";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function notifyAdminOfPaidOrder(celebrationId: string, customerEmail?: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!resendKey || !fromEmail) {
    console.warn("order notification skipped: email provider is not configured");
    return;
  }

  const celebrationRef = adminDb.collection(COLLECTIONS.CELEBRATIONS).doc(celebrationId);
  let celebration: Record<string, unknown> | null = null;
  const claimed = await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(celebrationRef);
    const data = snapshot.data();
    if (!snapshot.exists || !data || data.adminOrderEmailSentAt || data.adminOrderEmailClaimedAt) return false;
    celebration = data;
    transaction.update(celebrationRef, { adminOrderEmailClaimedAt: Timestamp.now() });
    return true;
  });
  if (!claimed || !celebration) return;

  const data = celebration as Record<string, unknown>;
  const amountPaise = Number(data.chargedPaise ?? data.pricePaise ?? 0);
  const amount = Number.isFinite(amountPaise) ? `₹${(amountPaise / 100).toLocaleString("en-IN")}` : "Not recorded";

  try {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: fromEmail,
      to: ORDER_EMAIL,
      ...(customerEmail ? { replyTo: customerEmail } : {}),
      subject: `Paid Just4You order: ${String(data.recipientName ?? celebrationId)}`,
      html: `<h2>New paid order</h2><p><strong>Order:</strong> ${escapeHtml(celebrationId)}</p><p><strong>Recipient:</strong> ${escapeHtml(data.recipientName)}</p><p><strong>Occasion:</strong> ${escapeHtml(data.occasionType ?? "birthday")}</p><p><strong>Customer email:</strong> ${escapeHtml(customerEmail ?? "Not available")}</p><p><strong>Amount:</strong> ${escapeHtml(amount)}</p><p><strong>Theme:</strong> ${escapeHtml(data.theme)}</p><p><strong>Slug:</strong> ${escapeHtml(data.slug)}</p>`,
    });
    await celebrationRef.update({
      adminOrderEmailSentAt: Timestamp.now(),
      adminOrderEmailClaimedAt: FieldValue.delete(),
    });
  } catch (error) {
    await celebrationRef.update({ adminOrderEmailClaimedAt: FieldValue.delete() }).catch(() => undefined);
    console.error("paid order admin notification failed:", error);
  }
}