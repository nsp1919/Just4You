import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import WeddingInvitation, {
  type WeddingInvitationData,
} from "@/components/wedding/WeddingInvitation";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-wedding-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-wedding-body",
});

export const metadata: Metadata = {
  title: "Aarohi & Vihaan | Wedding Invitation",
  description: "Join Aarohi and Vihaan for six joyful celebrations.",
};

const DEMO_INVITATION: WeddingInvitationData = {
  couple: {
    partnerOne: "Aarohi",
    partnerTwo: "Vihaan",
    monogram: "A · V",
  },
  families: "The Mehtas & The Reddys",
  date: "2026-12-11T18:00:00+05:30",
  location: "Taj Falaknuma Palace, Hyderabad",
  hashtag: "#AAROHIMEETSVIHAAN",
  heroImage: "/wedding-demo/couple.jpg",
  directionsUrl: "https://maps.google.com/?q=Taj+Falaknuma+Palace+Hyderabad",
  videoUrl: "https://res.cloudinary.com/demo/video/upload/cld-sample-video.mp4",
  whatsappNumber: "919999999999",
  ceremonies: [
    {
      id: "bonalu",
      name: "Bonalu",
      subtitle: "Gratitude and blessings",
      date: "2026-12-07T11:00:00+05:30",
      time: "11:00 AM onwards",
      venue: "The Courtyard, Falaknuma Palace",
      dressCode: "Traditional festive attire",
      note: "We offer Bonam and seek the blessings of Ammavaru before the wedding.",
      image: "/wedding-demo/haldi.jpg",
      interaction: "bonalu",
    },
    {
      id: "haldi",
      name: "Haldi",
      subtitle: "Sunshine, laughter and turmeric",
      date: "2026-12-08T16:00:00+05:30",
      time: "4:00 PM onwards",
      venue: "The Courtyard, Falaknuma Palace",
      dressCode: "Shades of yellow",
      note: "An afternoon painted in sunshine and the warmest blessings.",
      image: "/wedding-demo/haldi.jpg",
      interaction: "scratch",
    },
    {
      id: "mehndi",
      name: "Mehndi",
      subtitle: "Where henna meets hearts",
      date: "2026-12-09T17:30:00+05:30",
      time: "5:30 PM onwards",
      venue: "Jade Terrace, Falaknuma Palace",
      dressCode: "Pastels & florals",
      note: "The deeper the mehndi, the deeper the love.",
      image: "/wedding-demo/mehndi.jpg",
      interaction: "trace",
    },
    {
      id: "sangeet",
      name: "Sangeet",
      subtitle: "An evening of song",
      date: "2026-12-10T19:00:00+05:30",
      time: "7:00 PM onwards",
      venue: "Durbar Hall, Falaknuma Palace",
      dressCode: "Jewel tones",
      note: "Music, mischief and the whole family on its feet.",
      image: "/wedding-demo/sangeet.jpg",
      interaction: "rhythm",
    },
    {
      id: "wedding",
      name: "The Wedding",
      subtitle: "The muhurtham",
      date: "2026-12-11T18:00:00+05:30",
      time: "6:00 PM onwards",
      venue: "Main Lawns, Falaknuma Palace",
      dressCode: "Traditional",
      note: "The sacred vows, witnessed by everyone we love.",
      image: "/wedding-demo/couple.jpg",
      interaction: "wedding",
    },
    {
      id: "reception",
      name: "Reception",
      subtitle: "Dinner and dancing",
      date: "2026-12-12T19:30:00+05:30",
      time: "7:30 PM onwards",
      venue: "Durbar Hall, Falaknuma Palace",
      dressCode: "Evening formal",
      note: "Raise a toast and celebrate the beginning of forever.",
      image: "/wedding-demo/sangeet.jpg",
      interaction: "reception",
    },
  ],
};

export default function WeddingDemoPage() {
  return (
    <div className={`${cormorant.variable} ${manrope.variable}`}>
      <WeddingInvitation invitation={DEMO_INVITATION} />
    </div>
  );
}