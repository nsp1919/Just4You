import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

// AI message writer. Generates heartfelt draft messages for a celebration.
// Uses Google Gemini when GEMINI_API_KEY is configured; otherwise falls back
// to a built-in template engine so the feature always works (and never breaks
// the build). Flip to a paid add-on later by gating the caller on a feature.

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Body = {
  occasionType?: string;
  relation?: string;
  recipientName?: string;
  tone?: string; // e.g. "heartfelt", "funny", "poetic", "short"
  memories?: string; // optional free text of memories/notes
};

const OCCASION_LABEL: Record<string, string> = {
  birthday: "birthday",
  "kids-birthday": "birthday",
  anniversary: "anniversary",
  proposal: "proposal",
};

function templateMessages(b: Body): string[] {
  const name = (b.recipientName || "you").trim();
  const rel = (b.relation || "someone special").replace(/_/g, " ");
  const occ = OCCASION_LABEL[b.occasionType || "birthday"] || "special day";

  if (b.occasionType === "proposal") {
    return [
      `From the moment you walked into my life, everything felt like home. ${name}, you are my favourite hello and my never goodbye. Through every season, my heart has only grown more certain of one thing — it belongs with you. So here, with all that I am: will you marry me? 💍`,
      `${name}, loving you has been the easiest, truest thing I've ever done. You make ordinary days feel like magic and hard days feel survivable. I want every chapter after this one to be written with you. Will you spend forever with me? ❤️`,
      `They say you just know — and I do. I know it in your laugh, in the quiet mornings, in the way you make me want to be better. ${name}, I don't want a single day without you in it. Marry me? 💫`,
    ];
  }
  if (b.occasionType === "anniversary") {
    return [
      `Happy anniversary, ${name}. Another year of choosing each other — through the beautiful and the ordinary — and I'd choose you again in a heartbeat. Thank you for being my home, my calm, and my greatest adventure. Here's to us, always. ❤️`,
      `${name}, every year with you is my favourite year. We've built something quiet and strong and real, and I fall for it — and you — a little more each day. Happy anniversary, my love. 🌹`,
      `To the one who feels like forever: happy anniversary. Loving you is the best decision I ever made, and I'd make it a thousand times over. Thank you for this life we're building together. 💕`,
    ];
  }
  // birthday / kids-birthday / default
  const base = [
    `Happy birthday, ${name}! 🎂 The world got a little brighter the day you arrived in it, and it's been shining ever since. Thank you for being exactly who you are — kind, wonderful, and impossible not to love. Here's to a year as beautiful as you make everyone around you feel. ✨`,
    `${name}, on your birthday I just want you to know how deeply you're appreciated. Being your ${rel} is one of my favourite things about my life. May this year bring you every ounce of the joy you give the rest of us. 🎉`,
    `Another trip around the sun for the incredible ${name}! 🌟 May your ${occ} be full of laughter, cake, and people who love you — and may this year be your happiest, brightest chapter yet. 🎈`,
  ];
  return base;
}

async function geminiMessages(b: Body, apiKey: string): Promise<string[] | null> {
  const rel = (b.relation || "someone special").replace(/_/g, " ");
  const occ = OCCASION_LABEL[b.occasionType || "birthday"] || "special day";
  const tone = b.tone || "heartfelt and warm";
  const memories = b.memories?.trim()
    ? `Weave in these specific memories/notes if natural: ${b.memories.trim()}.`
    : "";

  const prompt = `Write 3 distinct ${tone} ${occ} messages for ${b.recipientName || "them"}, written from their ${rel}.
Each message: 45-90 words, warm and personal, first person, suitable to display on a surprise website. Avoid clichés where possible. ${memories}
Return ONLY the 3 messages separated by the delimiter "|||". No numbering, no preamble.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 700 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parts = text
      .split("|||")
      .map((s: string) => s.trim())
      .filter(Boolean);
    return parts.length ? parts.slice(0, 3) : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Require a valid Firebase auth token. This endpoint can proxy a paid Gemini
  // API once GEMINI_API_KEY is set, so leaving it open would allow anonymous
  // cost-abuse / DoS. Authenticated users only.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await adminAuth.verifyIdToken(authHeader.slice(7));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    // ignore — use defaults
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const ai = await geminiMessages(body, apiKey);
    if (ai && ai.length) {
      return NextResponse.json({ messages: ai, source: "ai" });
    }
  }
  // Fallback keeps the feature working with no key / on any error.
  return NextResponse.json({ messages: templateMessages(body), source: "template" });
}
