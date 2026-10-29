/**
 * Orbit Brand Brain Intelligence Engine
 * Extracts the complete DNA of a brand — strategy, psychology, positioning,
 * content, products, and audience intelligence — from scraped website data.
 */

import type { ScrapedBrandBundle } from "./firecrawl.server";

export type ProductBrain = {
  name: string;
  url: string | null;
  price: string | null;
  currency: string | null;
  description: string;
  features: string[];
  benefits: string[];
  category: string | null;
  image_urls: string[];
};

export type VisualIdentityBrain = {
  colors: string[];
  style: string;
  imagery_style: string;
};

/** Deep audience segment with full psychological profile */
export type AudienceSegment = {
  segment: string;
  age_range: string | null;
  psychographics: string[];
  pain_points: string[];
  buying_trigger: string;
};

/** Competitor & market positioning intelligence */
export type MarketPosition = {
  niche: string;
  price_tier: string;
  differentiation: string[];
  perceived_competitors: string[];
  market_gap_exploited: string;
};

/** Content & messaging DNA */
export type MessagingDNA = {
  headline_style: string;
  copywriting_tone: string;
  power_words: string[];
  emotional_triggers: string[];
  cta_style: string;
  content_pillars: string[];
  brand_promise: string;
};

/** Video & social content strategy */
export type ContentStrategy = {
  video_angles: {
    hook: string;
    format: string;
    why_converts: string;
  }[];
  ad_copy_angles: string[];
  qualifying_questions: string[];
  auto_reply_dm: string;
};

/** Complete Brand Brain — the DNA of the brand */
export type BrandBrain = {
  brand_name: string;
  description: string;
  positioning: string;

  // Audience
  target_audience: string[];
  audience_segments: AudienceSegment[];

  // Personality
  tone: string[];
  brand_personality: string[];
  brand_archetype: string | null;
  brand_promise: string | null;

  // Strategy
  key_values: string[];
  key_selling_points: string[];
  market_position: MarketPosition | null;

  // Messaging
  messaging_dna: MessagingDNA | null;

  // Content
  content_strategy: ContentStrategy | null;

  // Products
  products: ProductBrain[];

  // Visual
  visual_identity: VisualIdentityBrain;

  // Trust
  important_claims: string[];
  trust_signals: string[];
  social_proof: string[];

  // Distribution
  social_links: string[];

  _meta?: {
    scrapedUrl: string;
    domain: string;
    logo: string | null;
    source: "gemini" | "groq" | "gateway" | "fallback";
    usedFirecrawl: boolean;
  };
};

// ─── Utility helpers ──────────────────────────────────────────────────────────

function toStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((item) => String(item ?? "").trim())
    .filter((item) => item.length > 0);
}

function toStringOrNull(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s.length > 0 && s.toLowerCase() !== "null" && s.toLowerCase() !== "n/a" ? s : null;
}

function toString(val: unknown, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  return String(val).trim();
}

function toObjectOrNull(val: unknown): Record<string, unknown> | null {
  if (val && typeof val === "object" && !Array.isArray(val)) return val as Record<string, unknown>;
  return null;
}

// ─── Schema Validator & Cleaner ───────────────────────────────────────────────

export function validateAndCleanBrandBrain(
  raw: Record<string, unknown>,
  bundle: ScrapedBrandBundle,
  source: "gemini" | "groq" | "gateway" | "fallback"
): BrandBrain {
  const brand_name = toString(raw["brand_name"], bundle.brandNameGuess || bundle.domain);
  const description = toString(raw["description"], bundle.description || `${brand_name} offers products and services at ${bundle.domain}.`);
  const positioning = toString(raw["positioning"], description);
  const brand_promise = toStringOrNull(raw["brand_promise"]);
  const brand_archetype = toStringOrNull(raw["brand_archetype"]);

  const target_audience = toStringArray(raw["target_audience"]);
  const tone = toStringArray(raw["tone"]);
  const brand_personality = toStringArray(raw["brand_personality"]);
  const key_values = toStringArray(raw["key_values"]);
  const key_selling_points = toStringArray(raw["key_selling_points"]);
  const important_claims = toStringArray(raw["important_claims"]);
  const trust_signals = toStringArray(raw["trust_signals"]);
  const social_proof = toStringArray(raw["social_proof"]);

  // Audience segments
  const rawSegments = Array.isArray(raw["audience_segments"]) ? raw["audience_segments"] as unknown[] : [];
  const audience_segments: AudienceSegment[] = rawSegments.map((s) => {
    const seg = toObjectOrNull(s) ?? {};
    return {
      segment: toString(seg["segment"], "General audience"),
      age_range: toStringOrNull(seg["age_range"]),
      psychographics: toStringArray(seg["psychographics"]),
      pain_points: toStringArray(seg["pain_points"]),
      buying_trigger: toString(seg["buying_trigger"], ""),
    };
  }).filter((s) => s.segment && s.segment !== "General audience");

  // Market position
  const rawMarket = toObjectOrNull(raw["market_position"]);
  const market_position: MarketPosition | null = rawMarket ? {
    niche: toString(rawMarket["niche"], ""),
    price_tier: toString(rawMarket["price_tier"], ""),
    differentiation: toStringArray(rawMarket["differentiation"]),
    perceived_competitors: toStringArray(rawMarket["perceived_competitors"]),
    market_gap_exploited: toString(rawMarket["market_gap_exploited"], ""),
  } : null;

  // Messaging DNA
  const rawMsg = toObjectOrNull(raw["messaging_dna"]);
  const messaging_dna: MessagingDNA | null = rawMsg ? {
    headline_style: toString(rawMsg["headline_style"], ""),
    copywriting_tone: toString(rawMsg["copywriting_tone"], ""),
    power_words: toStringArray(rawMsg["power_words"]),
    emotional_triggers: toStringArray(rawMsg["emotional_triggers"]),
    cta_style: toString(rawMsg["cta_style"], ""),
    content_pillars: toStringArray(rawMsg["content_pillars"]),
    brand_promise: toString(rawMsg["brand_promise"], ""),
  } : null;

  // Content strategy
  const rawContent = toObjectOrNull(raw["content_strategy"]);
  const content_strategy: ContentStrategy | null = rawContent ? {
    video_angles: (() => {
      const arr = Array.isArray(rawContent["video_angles"]) ? rawContent["video_angles"] as unknown[] : [];
      return arr.map((v) => {
        const vo = toObjectOrNull(v) ?? {};
        return {
          hook: toString(vo["hook"], ""),
          format: toString(vo["format"], ""),
          why_converts: toString(vo["why_converts"], ""),
        };
      }).filter((v) => v.hook);
    })(),
    ad_copy_angles: toStringArray(rawContent["ad_copy_angles"]),
    qualifying_questions: toStringArray(rawContent["qualifying_questions"]),
    auto_reply_dm: toString(rawContent["auto_reply_dm"], ""),
  } : null;

  // Social links
  const extractedSocials = toStringArray(raw["social_links"]);
  const combinedSocials = Array.from(new Set([...extractedSocials, ...bundle.socialLinks]));

  // Visual identity
  const rawVisual = toObjectOrNull(raw["visual_identity"]) ?? {};
  const colors = toStringArray(rawVisual["colors"]);
  const visual_identity: VisualIdentityBrain = {
    colors: colors.length > 0 ? colors : ["#0F172A", "#3B82F6", "#F8FAFC"],
    style: toString(rawVisual["style"], "Modern & Clean"),
    imagery_style: toString(rawVisual["imagery_style"], "High-quality product photography"),
  };

  // Products — prefer real scraped catalog, enrich with AI-derived details
  const rawProducts = Array.isArray(raw["products"]) ? (raw["products"] as unknown[]) : [];
  let products: ProductBrain[] = [];

  if (bundle.discoveredProducts && bundle.discoveredProducts.length > 0) {
    products = bundle.discoveredProducts.map((dp) => {
      const matchingGemini = rawProducts.find((gp: unknown) => {
        if (!gp || typeof gp !== "object") return false;
        const g = gp as Record<string, unknown>;
        return (
          (g["url"] && String(g["url"]).includes(dp.url)) ||
          (g["name"] && dp.name.toLowerCase().includes(String(g["name"]).toLowerCase().slice(0, 15)))
        );
      }) as Record<string, unknown> | undefined;

      return {
        name: matchingGemini ? toString(matchingGemini["name"], dp.name) : dp.name,
        url: dp.url,
        price: dp.price,
        currency: dp.currency,
        description: matchingGemini ? toString(matchingGemini["description"], dp.description) : dp.description,
        features:
          matchingGemini && toStringArray(matchingGemini["features"]).length > 0
            ? toStringArray(matchingGemini["features"])
            : dp.features,
        benefits:
          matchingGemini && toStringArray(matchingGemini["benefits"]).length > 0
            ? toStringArray(matchingGemini["benefits"])
            : dp.benefits,
        category: dp.category,
        image_urls: dp.image_urls,
      };
    });
  } else if (rawProducts.length > 0) {
    products = rawProducts.map((pRaw) => {
      const p = toObjectOrNull(pRaw) ?? {};
      let productImages = toStringArray(p["image_urls"]).filter((img) => img.startsWith("http"));
      if (productImages.length === 0) {
        const pName = toString(p["name"]).toLowerCase();
        const match = bundle.allImages.find((img) => {
          const lower = img.toLowerCase();
          return pName.split(" ").some((word) => word.length > 3 && lower.includes(word));
        });
        if (match) productImages = [match];
      }
      return {
        name: toString(p["name"], "Featured Product"),
        url: toStringOrNull(p["url"]) || bundle.finalUrl,
        price: toStringOrNull(p["price"]),
        currency: toStringOrNull(p["currency"]),
        description: toString(p["description"], ""),
        features: toStringArray(p["features"]),
        benefits: toStringArray(p["benefits"]),
        category: toStringOrNull(p["category"]) || "Featured Products",
        image_urls: productImages,
      };
    });
  }

  return {
    brand_name,
    description,
    positioning,
    target_audience,
    audience_segments,
    tone,
    brand_personality,
    brand_archetype,
    brand_promise,
    key_values,
    key_selling_points,
    market_position,
    messaging_dna,
    content_strategy,
    products,
    visual_identity,
    important_claims,
    trust_signals,
    social_proof,
    social_links: combinedSocials,
    _meta: {
      scrapedUrl: bundle.finalUrl,
      domain: bundle.domain,
      logo: bundle.logo,
      source,
      usedFirecrawl: bundle.usedFirecrawl,
    },
  };
}

// ─── Gemini API ───────────────────────────────────────────────────────────────

async function callGeminiApi(
  systemPrompt: string,
  userPrompt: string,
  rawApiKey: string
): Promise<Record<string, unknown> | null> {
  const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, "").trim();
  const models = [
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash-lite",
  ];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          console.warn(`[Gemini] Quota limit (429). Stopping.`);
          break;
        }
        console.warn(`[Gemini] ${model} returned ${res.status}, trying next.`);
        continue;
      }

      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      }
    } catch (err) {
      console.warn(`[Gemini] Error with ${model}:`, err);
    }
  }
  return null;
}

// ─── Groq API ────────────────────────────────────────────────────────────────

async function callGroqApi(
  systemPrompt: string,
  userPrompt: string,
  rawApiKey: string
): Promise<Record<string, unknown> | null> {
  const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, "").trim();
  const models = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
  ];

  for (const model of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: `${systemPrompt}\n\nIMPORTANT: Respond with strict valid JSON only, without any explanatory text or Markdown outside the JSON.` },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 8192,
        }),
      });

      if (!res.ok) {
        console.warn(`[Groq] ${model} returned ${res.status}, trying next model.`);
        continue;
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const rawText = json.choices?.[0]?.message?.content ?? "";
      const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      }
    } catch (err) {
      console.warn(`[Groq] Error with ${model}:`, err);
    }
  }
  return null;
}

async function callLovableGateway(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8192,
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
    console.warn("[LovableGateway] Error:", err);
  }
  return null;
}

// ─── Deterministic Fallback ───────────────────────────────────────────────────

function buildFallbackBrandBrain(bundle: ScrapedBrandBundle): BrandBrain {
  const brandName = bundle.brandNameGuess || bundle.domain;
  const description =
    bundle.description ||
    `${brandName} offers specialized products and services at ${bundle.domain}.`;

  const candidateProducts: ProductBrain[] = (bundle.discoveredProducts && bundle.discoveredProducts.length > 0)
    ? bundle.discoveredProducts.map((p) => ({
        name: p.name,
        url: p.url,
        price: p.price,
        currency: p.currency,
        description: p.description,
        features: p.features,
        benefits: p.benefits,
        category: p.category,
        image_urls: p.image_urls,
      }))
    : [];

  return {
    brand_name: brandName,
    description,
    positioning: `${brandName} provides trusted solutions for modern buyers at ${bundle.domain}.`,
    target_audience: ["Modern consumers & professional shoppers", "Online customers seeking quality products"],
    audience_segments: [],
    tone: ["Modern", "Direct", "Trustworthy"],
    brand_personality: ["Innovative", "Minimal", "Confident"],
    brand_archetype: null,
    brand_promise: null,
    key_values: ["Customer Experience", "Product Quality", "Reliability"],
    key_selling_points: [
      bundle.title ? `Specialized in ${bundle.title}` : "Premium product standards",
      "Fast and seamless online ordering",
      "Direct brand support and guarantee",
    ],
    market_position: null,
    messaging_dna: null,
    content_strategy: null,
    products: candidateProducts,
    visual_identity: {
      colors: ["#0F172A", "#2563EB", "#F8FAFC"],
      style: "Clean & Contemporary",
      imagery_style: "High-resolution product and lifestyle photography",
    },
    important_claims: ["Verified online business", "Secure checkout and ordering"],
    trust_signals: [],
    social_proof: [],
    social_links: bundle.socialLinks,
    _meta: {
      scrapedUrl: bundle.finalUrl,
      domain: bundle.domain,
      logo: bundle.logo,
      source: "fallback",
      usedFirecrawl: bundle.usedFirecrawl,
    },
  };
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export async function generateBrandBrain(bundle: ScrapedBrandBundle): Promise<BrandBrain> {
  const geminiKey = process.env["GEMINI_API_KEY"];
  const groqKey = process.env["GROQ_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];

  const systemPrompt = `You are Orbit's Brand Intelligence Engine — the most advanced brand analysis AI ever built.

Your mission: Perform a McKinsey-level deep-dive brand audit using ONLY the scraped website data provided. Extract the complete psychological, strategic, and commercial DNA of the brand — the kind of analysis that would impress the brand's own founders and CMO.

You are simultaneously:
- A brand strategist who identifies positioning gaps and market opportunities
- A consumer psychologist who reads emotional triggers in copy and imagery
- A content director who spots the exact patterns that convert for this audience
- A competitive analyst who infers market position from language, pricing, and tone
- A direct-response copywriter who identifies the words and formulas that make this brand tick

=== RULES ===
1. ONLY use information found in the scraped data — no hallucination
2. INFERENCE is allowed and expected — read between the lines of copy, pricing, imagery
3. Be SPECIFIC — never say "quality products" when you can say the actual product name and its real claim
4. Be PSYCHOLOGICALLY DEEP — explain WHY people buy, not just what the brand sells
5. Return ONLY strictly minified JSON — no markdown, no text outside the JSON object

=== OUTPUT JSON SCHEMA ===
{
  "brand_name": "exact brand name from site",
  "description": "3-4 sentences covering what they sell, their unique angle, and why customers choose them. Use specifics.",
  "positioning": "Single precise sentence: who they serve, what they offer, how they differ from the obvious alternative",
  "brand_promise": "The transformation or implicit promise made to the customer — the outcome they are selling",
  "brand_archetype": "One of: Hero / Sage / Creator / Caregiver / Explorer / Innocent / Jester / Lover / Magician / Outlaw / Regular Guy / Ruler",

  "target_audience": ["3-5 concise audience descriptors"],

  "audience_segments": [
    {
      "segment": "Specific named segment e.g. 'Fitness-conscious millennial women in metros'",
      "age_range": "e.g. '22-35' or null",
      "psychographics": ["What they value", "How they see themselves", "Their lifestyle aspirations — 3-5 points derived from site signals"],
      "pain_points": ["3-4 specific problems this audience has that the brand directly solves"],
      "buying_trigger": "The exact moment or emotional state that pushes this segment to buy — be psychological and specific"
    }
  ],

  "tone": ["5-7 tone descriptors e.g. Bold, Warm, Scientific, Aspirational, Direct"],
  "brand_personality": ["5-6 personality traits — treat the brand as a person, how would they talk at a dinner party?"],
  "key_values": ["4-6 core values explicitly or implicitly demonstrated on the site"],
  "key_selling_points": ["5-8 SPECIFIC differentiators — actual claims from the site, not generic praise"],

  "market_position": {
    "niche": "Precise sub-niche e.g. 'Ayurvedic hair care for urban Indian women 25-40'",
    "price_tier": "e.g. 'Budget (under ₹300)', 'Mid-market (₹500-₹1500)', 'Premium (₹2000+)'",
    "differentiation": ["3-5 specific ways they stand out vs obvious category alternatives — use site evidence"],
    "perceived_competitors": ["2-4 category-level competitors inferred from their positioning language"],
    "market_gap_exploited": "The specific unmet need or gap this brand is filling — be precise"
  },

  "messaging_dna": {
    "headline_style": "Describe the pattern of their headlines e.g. 'Outcome-first, identity-affirming, punchy and short'",
    "copywriting_tone": "Describe the writing voice and style in specific detail",
    "power_words": ["8-12 specific high-frequency or high-weight words/phrases from the site content"],
    "emotional_triggers": ["5-7 psychological triggers actively used — e.g. 'fear of missing out', 'tribal belonging', 'status signaling', 'transformation desire'"],
    "cta_style": "How their calls-to-action work — language, urgency level, placement pattern",
    "content_pillars": ["3-5 recurring content themes the brand consistently builds around"],
    "brand_promise": "The transformation or outcome the brand consistently promises in its messaging"
  },

  "content_strategy": {
    "video_angles": [
      {
        "hook": "The exact first 3-second hook — write the actual words as if scripting it for this brand",
        "format": "One of: Before/After | POV Day-in-Life | Problem-Proof | Myth Bust | Listicle Snap | Founder Story | Social Proof Stack | Results Reveal | Educational",
        "why_converts": "Why this specific angle converts for this brand's specific audience — psychological reasoning"
      },
      {
        "hook": "Second hook — different angle",
        "format": "...",
        "why_converts": "..."
      },
      {
        "hook": "Third hook — different angle",
        "format": "...",
        "why_converts": "..."
      }
    ],
    "ad_copy_angles": ["4-6 specific written ad angles — e.g. 'Lead with the #1 pain, pivot to product as the fastest relief'"],
    "qualifying_questions": ["3-4 DM or sales qualifying questions that separate high-intent buyers from browsers — brand-specific"],
    "auto_reply_dm": "First automated DM to send an inbound lead — under 280 characters, brand-voice consistent, curiosity-opening"
  },

  "products": [
    {
      "name": "exact product name",
      "url": "product URL or null",
      "price": "numeric price string or null",
      "currency": "currency symbol/code or null",
      "description": "what it is and its key appeal from site content",
      "features": ["specific features explicitly listed on the site"],
      "benefits": ["customer benefits — what they gain, feel, or experience"],
      "category": "product category string",
      "image_urls": ["ONLY real image URLs from the provided Discovered Visual Assets list"]
    }
  ],

  "visual_identity": {
    "colors": ["hex codes or specific color names from the site — e.g. '#1A1A1A', 'warm terracotta'"],
    "style": "Visual aesthetic e.g. 'Dark luxury minimalist', 'Vibrant bold D2C', 'Clean clinical wellness'",
    "imagery_style": "Photography/visual approach e.g. 'Studio white-bg product shots with warm lifestyle hero images'"
  },

  "important_claims": ["Specific claims or certifications found on site — quote as close to verbatim as possible"],
  "trust_signals": ["Proof signals: review counts, ratings, awards, certifications, media coverage, years in business"],
  "social_proof": ["Specific social proof elements: 'Trusted by 50,000+ customers', 'Shark Tank featured', 'Vogue India pick'"],
  "social_links": ["full social media profile URLs found on the site"]
}`;

  const userPrompt = `=== SCRAPED WEBSITE DATA FOR BRAND DNA ANALYSIS ===

${bundle.combinedContent}

=== DISCOVERED VISUAL ASSETS (ONLY use these URLs for product image_urls) ===
${bundle.allImages.slice(0, 50).map((img) => `- ${img}`).join("\n") || "None found"}

=== SOCIAL PROFILES FOUND ===
${bundle.socialLinks.map((l) => `- ${l}`).join("\n") || "None found"}

=== YOUR TASK ===
Perform a complete, deep brand DNA extraction. Go deep on every dimension. The founder of this brand should read your output and feel like you understand their brand better than most of their own team does.
Return ONLY the JSON object — no preamble, no explanation.`;

  // 1. Try Direct Gemini API
  if (geminiKey && geminiKey.trim().length > 8 && geminiKey !== "YOUR_GEMINI_API_KEY") {
    try {
      const rawBrain = await callGeminiApi(systemPrompt, userPrompt, geminiKey);
      if (rawBrain) {
        return validateAndCleanBrandBrain(rawBrain, bundle, "gemini");
      }
    } catch (err) {
      console.warn("[BrandBrain] Gemini API failed, trying Groq fallback:", err);
    }
  }

  // 2. Try Groq API (fallback when Gemini fails or is unavailable)
  if (groqKey && groqKey.trim().length > 8 && groqKey !== "YOUR_GROQ_API_KEY") {
    try {
      console.info("[BrandBrain] Calling Groq API for brand intelligence extraction...");
      const rawBrain = await callGroqApi(systemPrompt, userPrompt, groqKey);
      if (rawBrain) {
        return validateAndCleanBrandBrain(rawBrain, bundle, "groq");
      }
    } catch (err) {
      console.warn("[BrandBrain] Groq API failed:", err);
    }
  }

  // 3. Try Lovable AI Gateway
  if (lovableKey && lovableKey.trim().length > 8) {
    try {
      const rawBrain = await callLovableGateway(systemPrompt, userPrompt, lovableKey);
      if (rawBrain) {
        return validateAndCleanBrandBrain(rawBrain, bundle, "gateway");
      }
    } catch (err) {
      console.warn("[BrandBrain] Lovable Gateway failed:", err);
    }
  }

  // 4. Deterministic fallback
  console.warn("[BrandBrain] All AI endpoints unavailable — using heuristic fallback.");
  return buildFallbackBrandBrain(bundle);
}
