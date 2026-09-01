export const BASE_PRICE_INR = 199;

const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER?.replace(/\D/g, "") || "919347762248";

export function whatsappContactUrl(message: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
