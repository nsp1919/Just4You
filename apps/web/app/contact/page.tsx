import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import PublicInfoPage, { InfoSection } from "@/components/PublicInfoPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Contact Us | Just4You",
  description: "Contact Novantix Technologies for Just4You customer, payment, delivery, privacy, and refund support.",
};

export default function ContactPage() {
  return (
    <PublicInfoPage
      eyebrow="Customer support"
      title="Contact the Just4You team"
      description={`All Just4You customer support is provided by ${BUSINESS.legalName}.`}
      highlights={[
        { icon: <Mail size={19} />, label: "Email", value: BUSINESS.email },
        { icon: <MessageCircle size={19} />, label: "Phone & WhatsApp", value: BUSINESS.phoneDisplay },
        { icon: <Clock3 size={19} />, label: "Typical acknowledgement", value: "Within 2 business days" },
      ]}
    >
      <InfoSection title="Support channels">
        <div className="grid gap-3 sm:grid-cols-2">
          <a href={`mailto:${BUSINESS.email}`} className="group flex min-h-32 flex-col justify-between rounded-lg border border-[#e3cbc3] bg-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-[#b44552] hover:shadow-[0_12px_30px_rgba(180,69,82,0.1)]">
            <span className="flex items-center justify-between text-[#b44552]"><Mail size={20} /><ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
            <span><strong className="block text-base">Email support</strong><span className="mt-1 block break-all text-sm text-[#756876]">{BUSINESS.email}</span></span>
          </a>
          <a href={BUSINESS.whatsappUrl} target="_blank" rel="noreferrer" className="group flex min-h-32 flex-col justify-between rounded-lg border border-[#e3cbc3] bg-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-[#b44552] hover:shadow-[0_12px_30px_rgba(180,69,82,0.1)]">
            <span className="flex items-center justify-between text-[#b44552]"><MessageCircle size={20} /><ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
            <span><strong className="block text-base">Chat on WhatsApp</strong><span className="mt-1 block text-sm text-[#756876]">{BUSINESS.phoneDisplay}</span></span>
          </a>
          <a href={BUSINESS.phoneHref} className="group flex min-h-32 flex-col justify-between rounded-lg border border-[#e3cbc3] bg-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-[#b44552] hover:shadow-[0_12px_30px_rgba(180,69,82,0.1)]">
            <span className="flex items-center justify-between text-[#b44552]"><Phone size={20} /><ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
            <span><strong className="block text-base">Call customer support</strong><span className="mt-1 block text-sm text-[#756876]">{BUSINESS.phoneDisplay}</span></span>
          </a>
          <div className="flex min-h-32 flex-col justify-between rounded-lg border border-[#e3cbc3] bg-[#fff1eb] p-5">
            <MapPin size={20} className="text-[#b44552]" />
            <span><strong className="block text-base">Business location</strong><span className="mt-1 block text-sm text-[#756876]">{BUSINESS.location}</span></span>
          </div>
        </div>
      </InfoSection>

      <InfoSection title="Payment, refund, or delivery support">
        <p>
          To help us find your order, contact us from your registered email and include your order ID or Razorpay payment ID, payment date,
          amount in INR, and a short description of the issue. Include screenshots where useful. Never send us your card CVV, OTP, UPI PIN,
          bank password, or complete card number.
        </p>
        <p>
          We normally acknowledge support and refund messages within 2 business days. Refund review and payment timelines are stated in our{" "}
          <Link href="/refund-policy">Refund and Cancellation Policy</Link>.
        </p>
      </InfoSection>

      <InfoSection title="Business and merchant identity">
        <p>
          Just4You is a product of <strong>{BUSINESS.legalName}</strong>, CIN {BUSINESS.cin}. Payments are processed and invoices are issued
          by Novantix Technologies. The company’s primary website is{" "}
          <a href={BUSINESS.companyUrl} target="_blank" rel="noreferrer">novantixtech.com</a>.
        </p>
      </InfoSection>
    </PublicInfoPage>
  );
}