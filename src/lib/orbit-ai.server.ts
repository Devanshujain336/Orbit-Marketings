const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_MODEL = "google/gemini-2.5-flash";

async function callModel(system: string, user: string): Promise<Record<string, unknown> | null> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const geminiKey = process.env["GEMINI_API_KEY"];

  // 1. Try Lovable AI Gateway if configured
  if (lovableKey) {
    try {
      const res = await fetch(GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: LOVABLE_MODEL,
          messages: [
            { role: "system", content: `${system}\nRespond with strict minified JSON only. No markdown fences.` },
            { role: "user", content: user },
          ],
        }),
      });
      if (res.ok) {
        const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const raw = payload.choices?.[0]?.message?.content ?? "";
        const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
        }
      }
    } catch (err) {
      console.warn("Lovable gateway failed, attempting Gemini fallback:", err);
    }
  }

  // 2. Try direct Google Gemini API if valid key is set
  if (geminiKey && geminiKey !== "YOUR_GEMINI_API_KEY" && geminiKey.trim().length > 8) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${system}\n\nTask:\n${user}\n\nStrict JSON response only:` }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });
      if (res.ok) {
        const payload = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
        }
      }
    } catch (err) {
      console.warn("Direct Gemini API call failed:", err);
    }
  }

  return null;
}

export type BrandAnalysis = {
  palette: { name: string; hex: string }[];
  vibe_keywords: string[];
  positioning: string;
  tone: string;
  summary: string;
  brand_identity: string;
  video_angles: string[];
  qualifying_questions: string[];
  source: "ai" | "heuristic";
};

export async function analyzeBrandWithAI(input: {
  name: string;
  website?: string;
  industry?: string;
  audience?: string;
  offer?: string;
  tone?: string;
}): Promise<BrandAnalysis> {
  const brandName = input.name.trim() || "Orbit";
  const audience = input.audience?.trim() || "founders and modern operators";
  const offer = input.offer?.trim() || "always-on short video marketing and automated lead qualification";
  const industry = input.industry?.trim() || "Software & Technology";
  const tone = input.tone?.trim() || "direct, punchy, outcome-led";

  // Deterministic high-converting heuristic defaults
  const fallbackPositioning = `${brandName} helps ${audience} turn attention into qualified pipeline with ${offer.toLowerCase().includes("video") ? offer : "high-velocity video and instant DM qualification"}.`;
  const fallbackAngles = [
    `The #1 reason ${audience} ignore your offer before ever booking a demo`,
    `POV: how ${brandName} takes ${offer.slice(0, 45)} and answers every buyer in 4 seconds`,
    `3 costly mistakes ${audience} make before switching to ${brandName}`,
  ];
  const fallbackQuestions = [
    "What is your target launch timeline for this campaign?",
    "What monthly media or ad budget are you allocating to this?",
    "Who on your leadership team will be testing and signing off?",
  ];
  const fallbackVibe = [
    tone.split(/[,–-]/)[0]?.trim().toLowerCase() || "direct",
    "outcome-driven",
    "velocity",
    "frictionless",
    "scalable",
  ];
  const fallbackPalette = [
    { name: "Asphalt Base", hex: "#0f1115" },
    { name: "Electric Signal", hex: "#22c55e" },
    { name: "Heat Boost", hex: "#f59e0b" },
    { name: "Telemetry Silver", hex: "#e2e8f0" },
  ];

  const system =
    "You are Orbit's brand strategist. From a startup's name, audience, and offer, create an undeniable positioning line, 3 viral video angles, 3 qualification questions, and brand vibe.";
  const prompt = `Business name: ${brandName}
Website: ${input.website || "N/A"}
Industry / Category: ${industry}
Target Audience / ICP: ${audience}
Core Offer / Value Prop: ${offer}
Preferred Tone: ${tone}

Return JSON with exact keys:
{
  "positioning": "one punchy, memorable, outcome-driven sentence positioning the brand",
  "summary": "2-3 sentences explaining what makes this offer win in the market",
  "brand_identity": "short descriptor of voice and personality",
  "tone": "short descriptor of tone",
  "vibe_keywords": ["5", "short", "lowercase", "keywords"],
  "video_angles": ["hook 1 for short video", "hook 2", "hook 3"],
  "qualifying_questions": ["DM qualifying question 1", "question 2", "question 3"],
  "palette": [{"name":"string", "hex":"#RRGGBB"}]
}`;

  const json = await callModel(system, prompt);

  if (json) {
    const palette = Array.isArray(json["palette"])
      ? (json["palette"] as { name?: string; hex?: string }[])
          .slice(0, 4)
          .map((p, i) => ({
            name: String(p.name || `Color ${i + 1}`),
            hex: typeof p.hex === "string" && /^#[0-9a-f]{6}$/i.test(p.hex) ? p.hex : fallbackPalette[i]?.hex || "#22c55e",
          }))
      : fallbackPalette;

    const vibeKeywords = Array.isArray(json["vibe_keywords"])
      ? (json["vibe_keywords"] as string[]).map((k) => String(k).trim()).filter(Boolean).slice(0, 6)
      : fallbackVibe;

    const videoAngles = Array.isArray(json["video_angles"])
      ? (json["video_angles"] as string[]).map((a) => String(a).trim()).filter(Boolean).slice(0, 4)
      : fallbackAngles;

    const qualifyingQuestions = Array.isArray(json["qualifying_questions"])
      ? (json["qualifying_questions"] as string[]).map((q) => String(q).trim()).filter(Boolean).slice(0, 3)
      : fallbackQuestions;

    return {
      positioning: String(json["positioning"] || fallbackPositioning),
      summary: String(json["summary"] || fallbackPositioning),
      brand_identity: String(json["brand_identity"] || `${industry} · ${tone}`),
      tone: String(json["tone"] || tone),
      vibe_keywords: vibeKeywords.length ? vibeKeywords : fallbackVibe,
      video_angles: videoAngles.length ? videoAngles : fallbackAngles,
      qualifying_questions: qualifyingQuestions.length ? qualifyingQuestions : fallbackQuestions,
      palette,
      source: "ai",
    };
  }

  return {
    positioning: fallbackPositioning,
    summary: fallbackPositioning,
    brand_identity: `${industry} · ${tone}`,
    tone,
    vibe_keywords: fallbackVibe,
    video_angles: fallbackAngles,
    qualifying_questions: fallbackQuestions,
    palette: fallbackPalette,
    source: "heuristic",
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
  brand: { name: string; vibe: string[]; positioning: string; tone: string; audience: string; offer?: string };
}): Promise<GeneratedContent> {
  const brandName = input.brand.name || "Orbit";
  const audience = input.brand.audience || "growth operators";
  const offer = input.brand.offer || input.brand.positioning || "our workflow";

  const fallbackHook = `If you're ${audience} losing deals in your DMs, watch this for 10 seconds.`;
  const fallbackScript = `0:00 [Cold open] "Most ${audience} think they have a traffic problem. Usually, they have a velocity problem."
0:03 [Screen cut] "Here is how ${brandName} fixes it with ${offer.slice(0, 50)}."
0:07 [Visual proof] "Every message answered in under 4 seconds. Zero unqualified meetings booked."
0:12 [CTA prompt] "Drop 'ORBIT' in the comments or DM us to get this exact workflow running for your team."`;
  const fallbackCaption = `${brandName} turns cold attention into warm, qualified buyers on autopilot. DM us 'START' for the blueprint.`;
  const fallbackHashtags = ["startups", "growthengine", "leadqualification", "videofunnel", "b2bscale"];

  const system =
    "You are Orbit's short-form video writer. You write scroll-stopping vertical video scripts that convert attention into high-ticket buyer DMs.";
  const prompt = `Brand: ${brandName}
Positioning: ${input.brand.positioning}
Audience: ${audience}
Offer: ${offer}
Tone: ${input.brand.tone || "direct, punchy"}
Pattern: ${input.pattern}
Creative Brief: ${input.brief}

Return JSON with exact keys:
{
  "title": "short internal title",
  "hook": "first 3 seconds of spoken or on-screen hook",
  "script": "time-coded script with beats (0:00, 0:03, etc.)",
  "caption": "platform caption with clear CTA",
  "hashtags": ["tag1", "tag2", "tag3", "tag4"]
}`;

  const json = await callModel(system, prompt);

  if (json) {
    const hashtags = Array.isArray(json["hashtags"])
      ? (json["hashtags"] as string[]).map((t) => String(t).replace(/^#/, "").trim()).filter(Boolean).slice(0, 8)
      : fallbackHashtags;

    return {
      title: String(json["title"] || input.brief.slice(0, 50) || `${brandName} ad draft`),
      hook: String(json["hook"] || fallbackHook),
      script: String(json["script"] || fallbackScript),
      caption: String(json["caption"] || fallbackCaption),
      hashtags: hashtags.length ? hashtags : fallbackHashtags,
    };
  }

  return {
    title: input.brief.slice(0, 50) || `${brandName} ad draft`,
    hook: fallbackHook,
    script: fallbackScript,
    caption: fallbackCaption,
    hashtags: fallbackHashtags,
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
  const brandName = input.brand.name || "Orbit";
  const message = input.message.toLowerCase();

  // Keyword intent signals for resilient heuristic evaluation
  const hasBudget = /budget|pricing|price|cost|quote|retainer|package|rate|\$|₹|k\b/i.test(message);
  const hasUrgency = /urgent|asap|this week|next week|today|immediately|now|ready|tomorrow/i.test(message);
  const hasScale = /team|enterprise|scale|production|volume|multiple|users|videos|leads/i.test(message);
  const hasBooking = /demo|call|chat|meet|discuss|calendar|schedule|slot/i.test(message);

  let heuristicScore = 50;
  if (hasBudget) heuristicScore += 22;
  if (hasUrgency) heuristicScore += 18;
  if (hasScale) heuristicScore += 12;
  if (hasBooking) heuristicScore += 10;
  heuristicScore = Math.min(96, Math.max(28, heuristicScore));

  const heuristicTier: "high" | "medium" | "low" =
    heuristicScore >= 78 ? "high" : heuristicScore >= 52 ? "medium" : "low";

  const heuristicReason =
    heuristicTier === "high"
      ? "Specific project scope, timeline, and commercial intent detected."
      : heuristicTier === "medium"
        ? "Interested buyer exploring fit; needs timeline and budget qualification."
        : "Casual inquiry; automated nurturing recommended before founder routing.";

  const heuristicReply = `Thanks for reaching out to ${brandName}! I'd love to help you dial this in. What's your target launch timeline, and what monthly volume or budget band should I plan around?`;

  const system =
    "You are Orbit's inbound lead qualification engine. You score buyer DMs by purchase intent and craft the perfect high-converting first reply.";
  const prompt = `Brand: ${brandName}
Offer: ${input.brand.offer}
Auto-reply tone: ${input.brand.replyTone}
Reply template hint: ${input.brand.template}
Channel: ${input.channel}
Handle: ${input.handle}
Inbound message: ${input.message}

Return JSON:
{
  "tier": "high" | "medium" | "low",
  "score": 0-100,
  "reason": "one sentence explaining the qualification score",
  "intent_summary": "one sentence summarizing what the buyer is asking for",
  "reply": "friendly, fast first reply asking the highest-leverage qualifying question"
}`;

  const json = await callModel(system, prompt);

  if (json) {
    const rawTier = String(json["tier"] ?? "").toLowerCase();
    const tier: "high" | "medium" | "low" =
      rawTier === "high" || rawTier === "low" ? rawTier : "medium";
    const score = Number(json["score"]);

    return {
      tier,
      score: Number.isFinite(score) ? Math.max(10, Math.min(99, Math.round(score))) : heuristicScore,
      reason: String(json["reason"] || heuristicReason),
      intent_summary: String(json["intent_summary"] || input.message.slice(0, 90)),
      reply: String(json["reply"] || heuristicReply),
    };
  }

  return {
    tier: heuristicTier,
    score: heuristicScore,
    reason: heuristicReason,
    intent_summary: input.message.slice(0, 90),
    reply: heuristicReply,
  };
}
