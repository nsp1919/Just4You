import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import { intentPageGraph } from "@/lib/seo";

export interface IntentPageContent {
  eyebrow: string;
  path: string;
  title: string;
  intro: string;
  serviceType: string;
  audience: string;
  demoPath: string;
  demoLabel: string;
  promise: string;
  points: string[];
  steps: Array<{ title: string; text: string }>;
  faqs: Array<{ question: string; answer: string }>;
}

export default function IntentLandingPage({ content }: { content: IntentPageContent }) {
  const pageSchema = intentPageGraph({
    path: content.path,
    title: content.title,
    description: content.intro,
    serviceType: content.serviceType,
    audience: content.audience,
    faqs: content.faqs,
  });
  return (
    <main className="min-h-screen bg-[#130d19] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
      <nav className="border-b border-white/10 px-5 py-4"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/" className="font-playfair text-xl font-bold text-[#fff5ec]">Just4You<span className="text-[#ffb877]">.buzz</span></Link><Link href="/pricing" className="text-sm font-bold text-[#ffb877]">Create yours</Link></div></nav>

      <section className="px-5 pb-20 pt-16 text-center sm:pt-24">
        <div className="mx-auto max-w-4xl"><p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#ff9e4f]">{content.eyebrow}</p><h1 className="font-playfair text-4xl font-bold leading-tight sm:text-6xl">{content.title}</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/58">{content.intro}</p><div className="mt-9 flex flex-wrap justify-center gap-3"><Link href="/pricing" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-[#ff8a5c] to-[#ff5f93] px-6 font-bold">Create from ₹199 <ArrowRight size={17} /></Link><a href={content.demoPath} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/15 px-6 font-semibold text-white/75"><Play size={16} /> Open live example</a></div></div>
      </section>

      <section className="border-y border-white/10 bg-[#0e0913] px-5 py-16"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Live example</p><h2 className="mt-3 font-playfair text-3xl font-bold">{content.demoLabel}</h2><p className="mt-4 leading-7 text-white/50">This is the actual interactive experience, not a screenshot. Open it fully to test the animations, music controls, and mobile layout.</p><a href={content.demoPath} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 font-bold text-[#ffb877]">View the full demo <ArrowRight size={15} /></a></div><iframe src={content.demoPath} title={content.demoLabel} loading="lazy" className="h-[560px] w-full rounded-lg border border-white/10 bg-black" /></div></section>

      <section className="px-5 py-20"><div className="mx-auto max-w-5xl"><div className="grid gap-12 md:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff9e4f]">What makes it personal</p><h2 className="mt-3 font-playfair text-3xl font-bold">{content.promise}</h2></div><div className="space-y-4">{content.points.map((point) => <div key={point} className="flex gap-3 border-b border-white/10 pb-4 text-white/65"><Check size={17} className="mt-1 shrink-0 text-emerald-300" /><span className="leading-7">{point}</span></div>)}</div></div></div></section>

      <section className="bg-[#1a1021] px-5 py-20"><div className="mx-auto max-w-5xl"><p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-pink-300">Simple to make</p><h2 className="mt-3 text-center font-playfair text-3xl font-bold">From idea to shareable link</h2><div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 md:grid-cols-3">{content.steps.map((step, index) => <div key={step.title} className="bg-[#1a1021] p-6"><span className="text-sm font-bold text-[#ffb877]">0{index + 1}</span><h3 className="mt-3 font-playfair text-xl font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-white/45">{step.text}</p></div>)}</div></div></section>

      <section className="px-5 py-20"><div className="mx-auto max-w-3xl"><div className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff9e4f]">Pricing</p><h2 className="mt-2 font-playfair text-3xl font-bold">Start at ₹199</h2><p className="mt-2 text-white/45">One payment, one year of hosting. Add only what matters.</p></div><Link href="/pricing" className="inline-flex items-center gap-2 font-bold text-[#ffb877]">See package options <ArrowRight size={15} /></Link></div><h2 className="font-playfair text-3xl font-bold">Questions people ask</h2><div className="mt-6 divide-y divide-white/10 border-y border-white/10">{content.faqs.map((faq) => <details key={faq.question} className="group py-5"><summary className="cursor-pointer list-none font-semibold text-white">{faq.question}</summary><p className="mt-3 leading-7 text-white/50">{faq.answer}</p></details>)}</div></div></section>

      <section className="border-t border-white/10 bg-[#0e0913] px-5 py-20 text-center"><h2 className="font-playfair text-3xl font-bold">Make the surprise feel unmistakably theirs.</h2><p className="mx-auto mt-3 max-w-xl text-white/50">Preview everything before payment, then share the finished page when you are ready.</p><Link href="/pricing" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-[#ff8a5c] to-[#ff5f93] px-7 font-bold">Start creating <ArrowRight size={17} /></Link></section>
    </main>
  );
}