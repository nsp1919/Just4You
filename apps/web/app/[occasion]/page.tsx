import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { intentPageGraph, publicPageMetadata } from "@/lib/seo";

// SEO-focused occasion landing pages (SSG). Each targets a high-intent search
// query (e.g. "birthday surprise website maker") and funnels visitors to a live
// demo + the create flow. Static routes like /login, /demo, /wish take
// precedence over this dynamic segment; unknown slugs 404.

interface Props {
  params: Promise<{ occasion: string }>;
}

type OccasionLanding = {
  slug: string;
  demoTheme: string;
  demoPath?: string;
  eyebrow: string;
  h1: string;
  highlight: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  emoji: string;
  gradient: [string, string, string];
  benefits: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
};

const OCCASION_PAGES: Record<string, OccasionLanding> = {
  wedding: {
    slug: "wedding",
    demoTheme: "wedding",
    demoPath: "/invite/demo",
    eyebrow: "Interactive Wedding Invitations",
    h1: "Create a wedding invitation website",
    highlight: "every guest remembers",
    intro:
      "Bring every celebration into one elegant link with ceremonial doors, event timelines, interactive festival posters, individual reveal music, directions and WhatsApp RSVP.",
    metaTitle: "Interactive Wedding Invitation Website Maker | Just4You.buzz",
    metaDescription:
      "Create a personalized Indian wedding invitation website with Haldi, Mehndi, Sangeet and wedding events, custom poster images, music, RSVP and maps.",
    emoji: "🪔",
    gradient: ["#d9a01d", "#8a1736", "#315a46"],
    benefits: [
      { title: "Choose every celebration", desc: "Include Haldi, Mehndi, Sangeet, Bonalu, Wedding and next-day Reception, or only the events your family celebrates." },
      { title: "Interactive festival posters", desc: "Upload a custom image for each ceremony and reveal it through tactile guest interactions." },
      { title: "Individual reveal music", desc: "Give every festival poster its own custom track that begins when guests open it." },
      { title: "RSVP, maps and calendar", desc: "Guests can respond through WhatsApp, get directions and save each event." },
    ],
    faqs: [
      { q: "Can each function have different details and music?", a: "Yes. Every selected celebration has its own date, time, venue, dress code, poster image and optional reveal track." },
      { q: "Can we include only some ceremonies?", a: "Yes. Select exactly the festivals you are hosting and only those appear in the final invitation and RSVP form." },
    ],
  },
  birthday: {
    slug: "birthday",
    demoTheme: "galaxy",
    eyebrow: "Birthday Surprise Websites",
    h1: "Create a birthday surprise website",
    highlight: "they'll never forget",
    intro:
      "Turn photos, music and your heartfelt words into a stunning personalized birthday website. Share one link on WhatsApp or Instagram and watch their face light up.",
    metaTitle: "Birthday Surprise Website Maker — Personalized Birthday Pages | Just4You.buzz",
    metaDescription:
      "Create a personalized birthday surprise website in minutes — photos, music, countdown reveal & heartfelt messages. Delivered instantly after payment. Try a live demo free.",
    emoji: "🎂",
    gradient: ["#0f0c29", "#302b63", "#f7d971"],
    benefits: [
      { title: "Photo & video memories", desc: "Upload their favourite moments into a beautiful animated gallery." },
      { title: "Their special song", desc: "Add background music or record a personal voice message." },
      { title: "Surprise countdown reveal", desc: "Lock the page until the big day with an animated countdown." },
      { title: "Guest wishes wall", desc: "Let friends and family leave live reactions and messages." },
    ],
    faqs: [
      { q: "How do I share the birthday website?", a: "You get one link (e.g. just4you.buzz/wish/abc123). Share it on WhatsApp, Instagram or SMS and it opens a beautiful preview card with their name." },
      { q: "How long does it stay online?", a: "Your birthday website stays live and hosted securely for a full year." },
    ],
  },
  proposal: {
    slug: "proposal",
    demoTheme: "galaxy",
    eyebrow: "Proposal Websites",
    h1: "Pop the question with a proposal website",
    highlight: "worthy of a yes",
    intro:
      "Tell your love story with a cinematic, interactive proposal page — your journey in photos, your promises in words, and an unforgettable Will-You-Marry-Me reveal.",
    metaTitle: "Proposal Website Maker — Romantic Digital Proposal Pages | Just4You.buzz",
    metaDescription:
      "Create a romantic proposal website with your love story, photos, music and an interactive Yes reveal. Delivered instantly after payment. Explore a live demo free.",
    emoji: "💌",
    gradient: ["#18101e", "#302b63", "#ff6f9c"],
    benefits: [
      { title: "Your love story timeline", desc: "Walk them through your journey, moment by moment." },
      { title: "Cinematic reveal", desc: "An interactive Yes / No moment they'll remember forever." },
      { title: "Your song, your words", desc: "Set it to the song that's yours, or a recorded message." },
      { title: "Private & password-protected", desc: "Keep the surprise sealed until the perfect moment." },
    ],
    faqs: [
      { q: "Can I keep the proposal private?", a: "Yes — you can protect the page so only the person you're proposing to can open it." },
      { q: "Does the Yes button really react?", a: "Absolutely — the proposal theme includes a playful interactive Yes reveal with a burst of hearts." },
    ],
  },
  anniversary: {
    slug: "anniversary",
    demoTheme: "floral",
    eyebrow: "Anniversary Websites",
    h1: "Celebrate your anniversary with a website",
    highlight: "as timeless as your love",
    intro:
      "Honour years of togetherness with an elegant anniversary website — a beautiful timeline of your journey, your favourite photos, and a love letter they'll treasure.",
    metaTitle: "Anniversary Website Maker — Personalized Anniversary Pages | Just4You.buzz",
    metaDescription:
      "Create a romantic anniversary website with a timeline of memories, photos, music and a heartfelt message. Delivered instantly after payment. See a live demo free.",
    emoji: "💍",
    gradient: ["#fff0f5", "#ffb6c1", "#c8a96e"],
    benefits: [
      { title: "Journey timeline", desc: "Relive your years together, milestone by milestone." },
      { title: "Elegant photo gallery", desc: "Your best moments in a soft, romantic layout." },
      { title: "Your song", desc: "Set your memories to the music that's yours." },
      { title: "A lasting keepsake", desc: "Hosted for a full year to revisit any time." },
    ],
    faqs: [
      { q: "Is it good for a milestone anniversary?", a: "Perfect for 1st, 10th, 25th or any anniversary — the timeline scales beautifully to your years together." },
      { q: "Can family add messages?", a: "Yes, the guest wishes wall lets your whole family leave reactions and notes." },
    ],
  },
  "kids-birthday": {
    slug: "kids-birthday",
    demoTheme: "magical",
    eyebrow: "Kids Birthday Websites",
    h1: "A magical kids birthday website",
    highlight: "full of balloons & giggles",
    intro:
      "Give your little one a bright, playful birthday page — floating balloons, fun animations, all their photos, and wishes from everyone who loves them.",
    metaTitle: "Kids Birthday Website Maker — Fun Personalized Party Pages | Just4You.buzz",
    metaDescription:
      "Create a colourful kids birthday website with balloons, animations, photos, music and family wishes. Delivered instantly after payment. Try a live demo free.",
    emoji: "🧸",
    gradient: ["#fff7ed", "#fdf2f8", "#f43f5e"],
    benefits: [
      { title: "Playful animations", desc: "Floating balloons, confetti and bouncy toys kids love." },
      { title: "All their photos", desc: "Every adorable moment in a cheerful gallery." },
      { title: "Family wishes", desc: "Grandparents, cousins and friends can all leave a note." },
      { title: "Fun music", desc: "Add a happy tune or record a birthday message." },
    ],
    faqs: [
      { q: "Is it suitable for young kids?", a: "Yes — the Magical theme is bright, safe and designed to delight children with playful animations." },
      { q: "Can I use it for a party invite?", a: "Many parents share it as a keepsake and a fun invite in one link." },
    ],
  },
  graduation: {
    slug: "graduation",
    demoTheme: "minimal",
    eyebrow: "Graduation Websites",
    h1: "Celebrate a graduation with a website",
    highlight: "as proud as the moment",
    intro:
      "Honour years of hard work with a premium graduation tribute — milestone photos, messages from family and mentors, and a proud celebration of their achievement.",
    metaTitle: "Graduation Website Maker — Personalized Grad Tribute Pages | Just4You.buzz",
    metaDescription:
      "Create a graduation celebration website with milestone photos, messages and music to honour their achievement. Delivered instantly after payment. See a live demo free.",
    emoji: "🎓",
    gradient: ["#0f0c29", "#302b63", "#f7d971"],
    benefits: [
      { title: "Achievement showcase", desc: "Highlight their journey and proudest milestones." },
      { title: "Messages that matter", desc: "Collect notes from family, friends and mentors." },
      { title: "Photo gallery", desc: "From first day to graduation day, beautifully told." },
      { title: "A keepsake to revisit", desc: "Hosted for a full year to look back on." },
    ],
    faqs: [
      { q: "Can multiple people contribute messages?", a: "Yes — the guest wishes wall lets everyone add a proud note." },
      { q: "Is it good for any graduation?", a: "School, college, university or a professional milestone — it fits them all." },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(OCCASION_PAGES).map((occasion) => ({ occasion }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { occasion } = await params;
  const page = OCCASION_PAGES[occasion];
  if (!page) return {};
  return publicPageMetadata({
    path: `/${page.slug}`,
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: [page.eyebrow.toLowerCase(), `${page.slug.replace("-", " ")} website`, "personalized celebration website India"],
  });
}

export default async function OccasionLandingPage({ params }: Props) {
  const { occasion } = await params;
  const page = OCCASION_PAGES[occasion];
  if (!page) return notFound();

  const pageJsonLd = intentPageGraph({
    path: `/${page.slug}`,
    title: `${page.h1} ${page.highlight}`,
    description: page.metaDescription,
    serviceType: page.eyebrow,
    audience: "People planning a personalized digital celebration in India",
    faqs: page.faqs.map((faq) => ({ question: faq.q, answer: faq.a })),
  });

  return (
    <main className="min-h-screen bg-[#0a0612] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pt-24 pb-20 text-center">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${page.gradient[1]}55, transparent 70%)`,
          }}
        />
        <div className="relative max-w-3xl mx-auto">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-purple-300 mb-4">
            {page.emoji} {page.eyebrow}
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6">
            {page.h1}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-400">
              {page.highlight}
            </span>
          </h1>
          <p className="text-lg text-white/65 max-w-2xl mx-auto mb-9">{page.intro}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={page.slug === "wedding" ? "/dashboard/create?occasion=wedding" : "/dashboard/create"}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-white"
              style={{ background: "linear-gradient(135deg, #ff8a5c, #ff5f93)" }}
            >
              {page.slug === "wedding" ? "Create Our Invitation — from ₹199 →" : "Create Mine — from ₹199 →"}
            </Link>
            <Link
              href={page.demoPath ?? `/demo/${page.demoTheme}`}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-white border border-white/15 hover:border-white/30"
            >
              ▶ See a live demo
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-5 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {page.benefits.map((b) => (
            <div key={b.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
              <p className="text-white/55 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-16 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently asked questions</h2>
          <div className="space-y-4">
            {page.faqs.map((f) => (
              <details key={f.q} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <summary className="font-semibold cursor-pointer">{f.q}</summary>
                <p className="text-white/55 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-20 text-center border-t border-white/5">
        <h2 className="text-3xl font-bold mb-4">Ready to make their day unforgettable?</h2>
        <p className="text-white/60 mb-8">{page.slug === "wedding" ? "Start with one ceremony and add only the wedding features you need. Delivered instantly after payment." : "One flat price. Everything included. Delivered instantly after payment."}</p>
        <Link
          href={page.slug === "wedding" ? "/dashboard/create?occasion=wedding" : "/dashboard/create"}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white"
          style={{ background: "linear-gradient(135deg, #ff8a5c, #ff5f93)" }}
        >
          {page.slug === "wedding" ? "Create Our Wedding Invitation →" : "Create My Surprise — from ₹199 →"}
        </Link>
      </section>
    </main>
  );
}
