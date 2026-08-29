import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Birthday and Anniversary Reminders | Just4You.buzz",
  description: "Save birthdays, anniversaries, weddings, and special dates free. Receive email reminders 14, 7, and 2 days beforehand.",
  alternates: { canonical: "/reminders" },
};

export default function RemindersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}