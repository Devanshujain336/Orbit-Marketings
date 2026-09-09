import type { SiteSignals } from "./scrape.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

export type BrandIntel = {
  site: {
    url: string;
    domain: string;
    title: string;
    siteName: string;
    logo: string | null;
    ogImage: string | null;
    themeColor: string | null;
    wordCount: number;
    socials: string[];
    keyPages: string[];
    ctas: string[];
  };
  summary: string;
  brandIdentity: string;
  targetAudience: string;
  painPoints: string[];
  palette: { name: string; hex: string }[];
  vibeKeywords: string[];
  videoAngles: { hook: string; pattern: string; why: string }[];
  qualifyingQuestions: string[];
  autoReply: string;
  source: "ai" | "heuristic";
};

function coerceHex(value: unknown, fallback: string) {
  const raw = String(value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback;
}

function stringList(value: unknown, max: number) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter((item) => item.length > 1)
    .slice(0, max);
}

async function callGateway(signals: SiteSignals) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project.");

  const user = `Website: ${signals.finalUrl}
Brand name guess: ${signals.siteName}
Page title: ${signals.title}
Meta description: ${signals.description}
Buttons / calls to action: ${signals.ctas.join(" | ") || "none found"}
Navigation: ${signals.navLinks.join(" | ") || "none found"}
Headings:
${signals.headings.map((h) => `- ${h}`).join("\n") || "- none found"}

Page copy (truncated):
${signals.text.slice(0, 9000)}

Return JSON shaped exactly:
{"summary":"3-4 sentences on what the company sells and its unique value",
"brandIdentity":"1-2 sentences on brand voice, tone and visual vibe",
"targetAudience":"specific ideal customer profile with buying trigger",
"painPoints":["3 customer pains this brand removes"],
"palette":[{"name":"Primary","hex":"#RRGGBB"}] (4 entries inferred from the site's look),
"vibeKeywords":["5 short lowercase adjectives"],
"videoAngles":[{"hook":"first 3 seconds spoken/on-screen","pattern":"one of: problem_proof, pov_day, listicle_snap, myth_bust, before_after","why":"why this converts for this audience"}] (3 entries),
"qualifyingQuestions":["3 DM questions that separate high-value buyers from browsers"],
"autoReply":"the first automated DM reply to send an inbound lead, under 320 characters"}`;

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are Orbit's brand strategist. You turn a company's website into marketing intelligence. Respond with strict minified JSON only, no markdown fences.",
        },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`AI request failed (${res.status}): ${detail.slice(0, 160)}`);
  }

  const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = (payload.choices?.[0]?.message?.content ?? "").replace(/```json/gi, "").replace(/```/g, "");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("AI returned an unreadable response.");
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
}

function heuristic(signals: SiteSignals): Omit<BrandIntel, "site" | "source"> {
  const name = signals.siteName || signals.domain;
  const sentences = signals.text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 260);
  const summary =
    signals.description ||
    sentences.slice(0, 3).join(" ") ||
    `${name} presents its offer at ${signals.domain}, focused on turning visitors into customers.`;

  return {
    summary,
    brandIdentity: `${name} reads as ${signals.headings[0] ? `"${signals.headings[0]}"` : "direct and outcome-led"} — clear, confident, built for fast decisions.`,
    targetAudience: "Founders and growth teams who need a predictable flow of qualified inbound conversations.",
    painPoints: [
      "Great content never gets published consistently",
      "Ad spend reaches the wrong people",
      "Inbound DMs go unanswered for hours",
    ],
    palette: [
      { name: "Primary", hex: coerceHex(signals.themeColor, "#E4572E") },
      { name: "Accent", hex: "#F2A65A" },
      { name: "Surface", hex: "#1B1714" },
      { name: "Paper", hex: "#F6F1EA" },
    ],
    vibeKeywords: ["clear", "modern", "fast", "premium", "practical"],
    videoAngles: [
      {
        hook: `The reason buyers leave ${name} without messaging you`,
        pattern: "problem_proof",
        why: "Names the loss first, so the fix lands harder.",
      },
      {
        hook: `POV: your inbox after ${name} answers every DM in 4 seconds`,
        pattern: "pov_day",
        why: "Shows the outcome as lived experience, not a claim.",
      },
      {
        hook: `3 things ${name} does that agencies charge you 5x for`,
        pattern: "listicle_snap",
        why: "Fast cuts hold attention and stack value.",
      },
    ],
    qualifyingQuestions: [
      "What are you trying to fix in the next 30 days?",
      "What monthly budget have you set aside for this?",
      "Who else signs off on the decision with you?",
    ],
    autoReply: `Thanks for reaching out to ${name}! Quick one so I can point you the right way — what are you trying to fix first, and what timeline are you working to?`,
  };
}

export async function buildBrandIntel(signals: SiteSignals): Promise<BrandIntel> {
  const site: BrandIntel["site"] = {
    url: signals.finalUrl,
    domain: signals.domain,
    title: signals.title,
    siteName: signals.siteName,
    logo: signals.logo,
    ogImage: signals.ogImage,
    themeColor: signals.themeColor,
    wordCount: signals.wordCount,
    socials: signals.socials,
    keyPages: signals.navLinks,
    ctas: signals.ctas,
  };

  const fallback = heuristic(signals);

  try {
    const json = await callGateway(signals);
    const angles = Array.isArray(json["videoAngles"]) ? (json["videoAngles"] as Record<string, unknown>[]) : [];
    const palette = Array.isArray(json["palette"]) ? (json["palette"] as Record<string, unknown>[]) : [];

    return {
      site,
      source: "ai",
      summary: String(json["summary"] ?? fallback.summary),
      brandIdentity: String(json["brandIdentity"] ?? fallback.brandIdentity),
      targetAudience: String(json["targetAudience"] ?? fallback.targetAudience),
      painPoints: stringList(json["painPoints"], 4).length ? stringList(json["painPoints"], 4) : fallback.painPoints,
      palette: palette.length
        ? palette.slice(0, 6).map((entry, index) => ({
            name: String(entry["name"] ?? `Color ${index + 1}`),
            hex: coerceHex(entry["hex"], fallback.palette[index]?.hex ?? "#E4572E"),
          }))
        : fallback.palette,
      vibeKeywords: stringList(json["vibeKeywords"], 6).length
        ? stringList(json["vibeKeywords"], 6)
        : fallback.vibeKeywords,
      videoAngles: angles.length
        ? angles.slice(0, 4).map((entry, index) => ({
            hook: String(entry["hook"] ?? fallback.videoAngles[index]?.hook ?? ""),
            pattern: String(entry["pattern"] ?? "problem_proof"),
            why: String(entry["why"] ?? ""),
          }))
        : fallback.videoAngles,
      qualifyingQuestions: stringList(json["qualifyingQuestions"], 5).length
        ? stringList(json["qualifyingQuestions"], 5)
        : fallback.qualifyingQuestions,
      autoReply: String(json["autoReply"] ?? fallback.autoReply),
    };
  } catch (error) {
    console.warn("Brand AI analysis failed, using heuristic extraction:", error);
    return { site, source: "heuristic", ...fallback };
  }
}
