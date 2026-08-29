import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Admin Sign In | Just4You",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default function AdminAccessLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}