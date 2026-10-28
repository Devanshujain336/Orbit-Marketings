/**
 * Server-only Gemini Brand Brain generation for Orbit.
 * Generates the structured Brand Brain adhering strictly to the schema
 * and anti-hallucination rules.
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

export type BrandBrain = {
  brand_name: string;
  description: string;
  positioning: string;
  target_audience: string[];
  tone: string[];
  brand_personality: string[];
  key_values: string[];
  key_selling_points: string[];
  products: ProductBrain[];
  visual_identity: VisualIdentityBrain;
  important_claims: string[];
  social_links: string[];
  // Metadata & helpers
  _meta?: {
    scrapedUrl: string;
    domain: string;
    logo: string | null;
    source: "gemini" | "gateway" | "fallback";
    usedFirecrawl: boolean;
  };
};

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

/**
 * Validate and strictly clean the Gemini JSON response against the Brand Brain schema
 */
export function validateAndCleanBrandBrain(
  raw: Record<string, unknown>,
  bundle: ScrapedBrandBundle,
  source: "gemini" | "gateway" | "fallback"
): BrandBrain {
  const brand_name = toString(raw["brand_name"], bundle.brandNameGuess || bundle.domain);
  const description = toString(raw["description"], bundle.description || `${brand_name} offers modern products and services at ${bundle.domain}.`);
  const positioning = toString(raw["positioning"], description);

  const target_audience = toStringArray(raw["target_audience"]);
  const tone = toStringArray(raw["tone"]);
  const brand_personality = toStringArray(raw["brand_personality"]);
  const key_values = toStringArray(raw["key_values"]);
  const key_selling_points = toStringArray(raw["key_selling_points"]);
  const important_claims = toStringArray(raw["important_claims"]);

  // Social links: merge Gemini extracted with scraped links
  const extractedSocials = toStringArray(raw["social_links"]);
  const combinedSocials = Array.from(new Set([...extractedSocials, ...bundle.socialLinks]));

  // Visual identity
  const rawVisual = (raw["visual_identity"] && typeof raw["visual_identity"] === "object" ? raw["visual_identity"] : {}) as Record<string, unknown>;
  const colors = toStringArray(rawVisual["colors"]);
  const visual_identity: VisualIdentityBrain = {
    colors: colors.length > 0 ? colors : ["#0F172A", "#3B82F6", "#F8FAFC"],
    style: toString(rawVisual["style"], "Modern & Clean"),
    imagery_style: toString(rawVisual["imagery_style"], "High-quality product and lifestyle photography"),
  };

  // Products: prioritize genuine extracted products from the catalog
  const rawProducts = Array.isArray(raw["products"]) ? (raw["products"] as unknown[]) : [];
  let products: ProductBrain[] = [];

  if (bundle.discoveredProducts && bundle.discoveredProducts.length > 0) {
    products = bundle.discoveredProducts.map((dp) => {
      // Find if Gemini provided additional features/benefits for this product
      const matchingGemini = rawProducts.find((gp: unknown) => {
        if (!gp || typeof gp !== "object") return false;
        const g = gp as Record<string, unknown>;
        return (
          (g["url"] && String(g["url"]).includes(dp.url)) ||
          (g["name"] && dp.name.toLowerCase().includes(String(g["name"]).toLowerCase()))
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
      const p = (pRaw && typeof pRaw === "object" ? pRaw : {}) as Record<string, unknown>;
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
    tone,
    brand_personality,
    key_values,
    key_selling_points,
    products,
    visual_identity,
    important_claims,
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

/**
 * Call direct Google Gemini API
 */
async function callGeminiApi(systemPrompt: string, userPrompt: string, rawApiKey: string): Promise<Record<string, unknown> | null> {
  const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, "").trim();
  const models = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
  ];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          console.warn(`[Gemini API] Google Cloud project permission issue (403): The project for this API key has restricted access. Falling back to structured heuristic extractor.`);
          break; // Don't spam multiple models if the project itself has 403 access restrictions
        }
        if (res.status === 429) {
          console.warn(`[Gemini API] Quota limit reached (429). Falling back to structured extractor.`);
          break;
        }
        continue;
      }

      const json = (await res.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      }
    } catch (err) {
      console.warn(`Gemini call error with ${model}:`, err);
    }
  }

  return null;
}

/**
 * Call Lovable Gateway fallback if configured
 */
async function callLovableGateway(systemPrompt: string, userPrompt: string, apiKey: string): Promise<Record<string, unknown> | null> {
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
    console.warn("Lovable gateway call error:", err);
  }
  return null;
}

/**
 * Deterministic fallback Brand Brain if all AI endpoints are unavailable
 */
function buildFallbackBrandBrain(bundle: ScrapedBrandBundle): BrandBrain {
  const brandName = bundle.brandNameGuess || bundle.domain;
  const description =
    bundle.description ||
    `${brandName} offers specialized products and services at ${bundle.domain}.`;

  // Use genuine discovered products from the crawl
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
    positioning: `${brandName} provides trusted, high-performance solutions for modern buyers at ${bundle.domain}.`,
    target_audience: [
      "Modern consumers & professional shoppers",
      "Online customers seeking quality products",
    ],
    tone: ["Modern", "Direct", "Trustworthy"],
    brand_personality: ["Innovative", "Minimal", "Confident"],
    key_values: ["Customer Experience", "Product Quality", "Reliability"],
    key_selling_points: [
      bundle.title ? `Specialized in ${bundle.title}` : "Premium product standards",
      "Fast and seamless online ordering",
      "Direct brand support and guarantee",
    ],
    products: candidateProducts,
    visual_identity: {
      colors: ["#0F172A", "#2563EB", "#F8FAFC"],
      style: "Clean & Contemporary",
      imagery_style: "High-resolution product and lifestyle photography",
    },
    important_claims: [
      "Verified online business",
      "Secure checkout and ordering",
    ],
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

/**
 * Main engine: Orchestrates Gemini Brand Brain generation
 */
export async function generateBrandBrain(bundle: ScrapedBrandBundle): Promise<BrandBrain> {
  const geminiKey = process.env["GEMINI_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];

  const systemPrompt = `You are Orbit's Brand Brain Intelligence Engine.
Your task is to analyze scraped website information and produce a structured, high-accuracy Brand Brain JSON object.

### CRITICAL RULES — DO NOT HALLUCINATE:
1. Distinguish strictly between explicitly found information and reasonable inference.
2. If something is unknown (e.g. price is not found, specific materials are not stated, or features are not listed), return null or an empty array [].
3. DO NOT invent:
   - Product features
   - Prices or currencies
   - Customer demographics not supported by the site copy
   - Brand claims or certifications
   - Materials or benefits
4. For product image_urls, ONLY use the actual image URLs provided in the scraped visual assets list. Do NOT invent image URLs.
5. Return strictly minified JSON conforming EXACTLY to the following structure with no markdown or text wrappers.

JSON SCHEMA:
{
  "brand_name": "string",
  "description": "string (2-3 sentences)",
  "positioning": "string (core market positioning)",
  "target_audience": ["array of specific audience segments supported by clues"],
  "tone": ["array of tone descriptors like Modern, Friendly, Bold"],
  "brand_personality": ["array of personality traits like Minimal, Confident"],
  "key_values": ["array of core values inferred or stated"],
  "key_selling_points": ["array of key selling points and differentiators"],
  "products": [
    {
      "name": "string",
      "url": "string or null",
      "price": "string (e.g. '1999' or '49.99') or null if unknown",
      "currency": "string (e.g. 'INR', 'USD', '₹', '$') or null if unknown",
      "description": "string",
      "features": ["array of features explicitly found"],
      "benefits": ["array of customer benefits"],
      "category": "string or null",
      "image_urls": ["array of verified image URLs from scraped assets"]
    }
  ],
  "visual_identity": {
    "colors": ["array of hex codes or color names identified on the site"],
    "style": "string (e.g. Minimalist, Bold, Luxury)",
    "imagery_style": "string (e.g. Studio product shots, Lifestyle outdoor)"
  },
  "important_claims": ["array of specific claims, guarantees, or certifications found on the site"],
  "social_links": ["array of social profile URLs"]
}`;

  const userPrompt = `Scraped Brand Data for analysis:
${bundle.combinedContent}

Discovered Image Assets:
${bundle.allImages.slice(0, 20).map((img) => `- ${img}`).join("\n") || "None found"}

Discovered Social Links:
${bundle.socialLinks.map((l) => `- ${l}`).join("\n") || "None found"}

Generate the exact Brand Brain JSON now:`;

  // 1. Direct Google Gemini API
  if (geminiKey && geminiKey.trim().length > 8 && geminiKey !== "YOUR_GEMINI_API_KEY") {
    const rawBrain = await callGeminiApi(systemPrompt, userPrompt, geminiKey);
    if (rawBrain) {
      return validateAndCleanBrandBrain(rawBrain, bundle, "gemini");
    }
  }

  // 2. Lovable AI Gateway Fallback
  if (lovableKey && lovableKey.trim().length > 8) {
    const rawBrain = await callLovableGateway(systemPrompt, userPrompt, lovableKey);
    if (rawBrain) {
      return validateAndCleanBrandBrain(rawBrain, bundle, "gateway");
    }
  }

  // 3. Resilient Fallback
  console.warn("Using fallback deterministic Brand Brain");
  return buildFallbackBrandBrain(bundle);
}
