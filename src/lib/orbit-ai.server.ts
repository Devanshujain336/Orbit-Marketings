const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callModel(system: string, user: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project.");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: `${system}\nRespond with strict minified JSON only. No markdown fences.` },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`AI request failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = payload.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("AI returned an unreadable response.");
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

export type BrandAnalysis = {
  palette: { name: string; hex: string }[];
  vibe_keywords: string[];
  positioning: string;
  tone: string;
};

export async function analyzeBrandWithAI(input: {
  name: string;
  website: string;
  industry: string;
  audience: string;
  offer: string;
  tone: string;
}): Promise<BrandAnalysis> {
  const json = await callModel(
    "You are Orbit's brand analyst. From a business's site and description, infer its visual identity and market positioning.",
    `Business: ${input.name}
Website: ${input.website}
Industry: ${input.industry}
Audience: ${input.audience}
Offer: ${input.offer}
Preferred tone: ${input.tone}

Return JSON shaped exactly:
{"palette":[{"name":"string","hex":"#RRGGBB"}] (4-5 entries),"vibe_keywords":["string"] (5 short lowercase words),"positioning":"one sentence positioning line","tone":"short tone descriptor"}`,
  );
  return {
    palette: Array.isArray(json['palette']) ? (json['palette'] as BrandAnalysis["palette"]).slice(0, 6) : [],
    vibe_keywords: Array.isArray(json['vibe_keywords']) ? (json['vibe_keywords'] as string[]).slice(0, 8) : [],
    positioning: String(json['positioning'] ?? ""),
    tone: String(json['tone'] ?? input.tone ?? ""),
  };
}

export type GeneratedContent = {
  title: string;
  hook: string;
  script: string;
  caption: string;
  hashtags: string[];
};

export async function generateContentWithAI(input: {
  brief: string;
  pattern: string;
  brand: { name: string; vibe: string[]; positioning: string; tone: string; audience: string };
}): Promise<GeneratedContent> {
  const json = await callModel(
    "You are Orbit's short-form video writer. You write scroll-stopping vertical video scripts that match the brand's voice.",
    `Brand: ${input.brand.name}
Positioning: ${input.brand.positioning}
Vibe: ${input.brand.vibe.join(", ")}
Tone: ${input.brand.tone}
Audience: ${input.brand.audience}
Viral pattern: ${input.pattern}
Brief: ${input.brief}

Return JSON shaped exactly:
{"title":"short internal title","hook":"first 3 seconds of spoken/on-screen hook","script":"beat-by-beat script with timecodes, newline separated","caption":"platform caption","hashtags":["tag"] (5-8, no # symbol)}`,
  );
  return {
    title: String(json['title'] ?? input.brief.slice(0, 60)),
    hook: String(json['hook'] ?? ""),
    script: String(json['script'] ?? ""),
    caption: String(json['caption'] ?? ""),
    hashtags: Array.isArray(json['hashtags']) ? (json['hashtags'] as string[]).slice(0, 10) : [],
  };
}

export type LeadQualification = {
  tier: "high" | "medium" | "low";
  score: number;
  reason: string;
  intent_summary: string;
  reply: string;
};

export async function qualifyLeadWithAI(input: {
  channel: string;
  handle: string;
  message: string;
  brand: { name: string; offer: string; replyTone: string; template: string };
}): Promise<LeadQualification> {
  const json = await callModel(
    "You are Orbit's lead qualification engine. You score inbound DMs by purchase intent and draft the first reply.",
    `Brand: ${input.brand.name}
Offer: ${input.brand.offer}
Auto-reply tone: ${input.brand.replyTone}
Reply template hint: ${input.brand.template}
Channel: ${input.channel}
Handle: ${input.handle}
Inbound message: ${input.message}

Return JSON shaped exactly:
{"tier":"high|medium|low","score":0-100,"reason":"one line why","intent_summary":"short intent summary","reply":"the auto-reply message to send now"}`,
  );
  const tier = String(json['tier'] ?? "medium").toLowerCase();
  const score = Number(json['score'] ?? 50);
  return {
    tier: tier === "high" || tier === "low" ? tier : "medium",
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 50,
    reason: String(json['reason'] ?? ""),
    intent_summary: String(json['intent_summary'] ?? input.message.slice(0, 90)),
    reply: String(json['reply'] ?? ""),
  };
}
