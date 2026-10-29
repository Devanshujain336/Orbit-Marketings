/**
 * Server-only Advertising Concept generation with Gemini for Orbit.
 * Generates structured, factually grounded advertising concepts and storyboards.
 */

import type { BrandBrain, ProductBrain } from "./gemini-brand-brain.server";
import {
  type VerifiedProductDetails,
  filterOutPlaceholderFeatures,
} from "./product-detail-fetcher.server";

export type StoryboardScene = {
  sceneNumber: number;
  timestamp: string;
  purpose: string;
  visualDescription: string;
  voiceoverOrDialogue: string;
  onScreenText: string;
};

export type CreativeDirection = {
  id: string;
  title: string;
  coreIdea: string;
  targetAudienceOrSituation: string;
  hook: string;
  creativeRationale: string;
  relevantProductFacts: string[];
};

export type AdvertisingConcept = {
  campaignIdea: string;
  hook: string;
  storyboard: StoryboardScene[];
  callToAction: string;
  duration: number; // in seconds (default 20)
  themeId: string;
  themeTitle: string;
  productName: string;
  brandName: string;
  source: "gemini" | "groq" | "grounded-fallback";
  selectedDirection?: CreativeDirection | undefined;
  verifiedProductDetails?: {
    fetched: boolean;
    url?: string | undefined;
    description?: string | undefined;
    features?: string[] | undefined;
    specifications?: string[] | undefined;
    materialsOrIngredients?: string[] | undefined;
    explicitClaims?: string[] | undefined;
  } | undefined;
};

function normalizeStringList(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const rec = item as Record<string, unknown>;
          if (rec["key"] || rec["value"]) return `${rec["key"] || ""}: ${rec["value"] || ""}`.trim();
          return JSON.stringify(item);
        }
        return String(item);
      })
      .filter(Boolean);
  }
  if (typeof input === "object") {
    return Object.entries(input as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .filter(Boolean);
  }
  if (typeof input === "string") return [input.trim()].filter(Boolean);
  return [];
}

/**
 * Call Gemini Flash for concept generation
 */
async function callGemini(systemPrompt: string, userPrompt: string, apiKey: string): Promise<Record<string, unknown> | null> {
  const models = [
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest",
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
            temperature: 0.3,
          },
        }),
      });

      if (!res.ok) {
        console.warn(`[Gemini API] Request failed with status ${res.status} on model ${model}`);
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
      console.warn(`Gemini concept generation error on ${model}:`, err);
    }
  }

  return null;
}

/**
 * Call Groq API when Gemini API fails
 */
async function callGroq(systemPrompt: string, userPrompt: string, rawApiKey: string): Promise<Record<string, unknown> | null> {
  const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, "").trim();
  const models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"];

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
            { role: "system", content: `${systemPrompt}\n\nStrict JSON response only:` },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (!res.ok) continue;

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
      console.warn(`Groq concept generation error on ${model}:`, err);
    }
  }

  return null;
}

async function callAiWithFallback(systemPrompt: string, userPrompt: string): Promise<{ data: Record<string, unknown> | null; source: "gemini" | "groq" }> {
  const geminiKey = (process.env["GEMINI_API_KEY"] || "").trim().replace(/^["']|["']$/g, "").trim();
  const groqKey = (process.env["GROQ_API_KEY"] || "").trim().replace(/^["']|["']$/g, "").trim();

  if (geminiKey && geminiKey !== "YOUR_GEMINI_API_KEY" && geminiKey.length > 8) {
    try {
      const res = await callGemini(systemPrompt, userPrompt, geminiKey);
      if (res) return { data: res, source: "gemini" };
    } catch (err) {
      console.warn("Gemini concept generation failed:", err);
    }
  }

  if (groqKey && groqKey !== "YOUR_GROQ_API_KEY" && groqKey.length > 8) {
    try {
      const res = await callGroq(systemPrompt, userPrompt, groqKey);
      if (res) return { data: res, source: "groq" };
    } catch (err) {
      console.warn("Groq concept generation failed:", err);
    }
  }

  return { data: null, source: "gemini" };
}

/**
 * Deterministic fallback grounded strictly in available brand & product data
 */
function buildGroundedFallbackConcept(
  brand: BrandBrain,
  product: ProductBrain,
  themeId: string,
  themeTitle: string,
  verifiedDetails?: VerifiedProductDetails | null,
  selectedDirection?: CreativeDirection | null
): AdvertisingConcept {
  const brandName = brand.brand_name || "Orbit";
  const productName = product.name || "Featured Product";
  const cleanFeatures = filterOutPlaceholderFeatures(
    verifiedDetails?.features && verifiedDetails.features.length > 0
      ? verifiedDetails.features
      : product.features
  );
  const materials = normalizeStringList(verifiedDetails?.materialsOrIngredients);
  const specs = normalizeStringList(verifiedDetails?.specifications);
  const claims = normalizeStringList(verifiedDetails?.explicitClaims);

  const featuresList = cleanFeatures.length > 0
    ? cleanFeatures.slice(0, 3).join(", ")
    : materials.length > 0
      ? materials.slice(0, 2).join(", ")
      : specs.length > 0
        ? specs.slice(0, 2).join(", ")
        : "verified product quality";

  const benefit: string = (claims.length > 0 && claims[0])
    ? claims[0]
    : (verifiedDetails?.description || product.description || "delivers genuine brand quality");

  const baseVerifiedDetails = verifiedDetails
    ? {
        fetched: verifiedDetails.fetchedSuccessfully,
        url: verifiedDetails.url,
        description: verifiedDetails.description,
        features: verifiedDetails.features,
        specifications: verifiedDetails.specifications,
        materialsOrIngredients: verifiedDetails.materialsOrIngredients,
        explicitClaims: verifiedDetails.explicitClaims,
      }
    : undefined;

  const campaignIdea = selectedDirection?.coreIdea || (themeId === "brand-commercial"
    ? `The standard of everyday excellence: how ${brandName} refuses to cut corners with ${productName}.`
    : themeId === "lifestyle-advertisement"
      ? `Effortless day-to-day: living seamlessly with ${productName}.`
      : `Precision in every detail: discovering the craft behind ${productName}.`);

  const hook = selectedDirection?.hook || (themeId === "brand-commercial"
    ? `Most brands talk about quality. ${brandName} built an obsession around it.`
    : themeId === "lifestyle-advertisement"
      ? `Ever wonder why certain routines just feel effortless?`
      : `Take a closer look. You've never seen ${productName} quite like this.`);

  if (themeId === "brand-commercial") {
    return {
      campaignIdea,
      hook,
      callToAction: `Experience ${brandName}. Discover ${productName} today.`,
      duration: 20,
      themeId,
      themeTitle,
      productName,
      brandName,
      source: "grounded-fallback",
      selectedDirection: selectedDirection ?? undefined,
      verifiedProductDetails: baseVerifiedDetails,
      storyboard: [
        {
          sceneNumber: 1,
          timestamp: "0:00 - 0:04",
          purpose: "Hook the viewer with cinematic mood and brand conviction.",
          visualDescription: `Cinematic macro shot bathed in soft light, establishing the unmistakable aesthetic of ${brandName}.`,
          voiceoverOrDialogue: hook,
          onScreenText: brandName.toUpperCase(),
        },
        {
          sceneNumber: 2,
          timestamp: "0:04 - 0:10",
          purpose: "Reveal the product as the hero embodiment of the brand mission.",
          visualDescription: `Fluid motion camera sweep revealing ${productName}. Detail focus on materials and finish.`,
          voiceoverOrDialogue: `Designed intentionally. Engineered with ${featuresList}.`,
          onScreenText: productName,
        },
        {
          sceneNumber: 3,
          timestamp: "0:10 - 0:16",
          purpose: "Deliver tangible value and emotional payoff.",
          visualDescription: `A high-contrast silhouette transition showing ${productName} in motion, illustrating effortless ease.`,
          voiceoverOrDialogue: `Because you shouldn't have to compromise on what matters every day.`,
          onScreenText: benefit,
        },
        {
          sceneNumber: 4,
          timestamp: "0:16 - 0:20",
          purpose: "Direct call to action and brand lockup.",
          visualDescription: `Clean minimalist lockup of ${brandName} alongside ${productName}${product.price ? ` with verified price ${product.currency || ''}${product.price}` : ''}.`,
          voiceoverOrDialogue: `Experience ${brandName}. Tap below to discover ${productName}.`,
          onScreenText: `Shop ${productName} | ${brandName}`,
        },
      ],
    };
  }

  if (themeId === "lifestyle-advertisement") {
    return {
      campaignIdea,
      hook,
      callToAction: `Upgrade your daily routine. Order ${productName} now.`,
      duration: 20,
      themeId,
      themeTitle,
      productName,
      brandName,
      source: "grounded-fallback",
      selectedDirection: selectedDirection ?? undefined,
      verifiedProductDetails: baseVerifiedDetails,
      storyboard: [
        {
          sceneNumber: 1,
          timestamp: "0:00 - 0:04",
          purpose: "Relatable opening hook connecting to daily reality.",
          visualDescription: `A natural handheld camera capture of a modern workspace or living space at morning light.`,
          voiceoverOrDialogue: hook,
          onScreenText: "Make every day effortless.",
        },
        {
          sceneNumber: 2,
          timestamp: "0:04 - 0:10",
          purpose: "Introduce the product integrated naturally into real life.",
          visualDescription: `Natural interaction showing someone utilizing ${productName} in their actual environment.`,
          voiceoverOrDialogue: `Meet ${productName}. Crafted by ${brandName} to fit intuitively into your flow.`,
          onScreenText: productName,
        },
        {
          sceneNumber: 3,
          timestamp: "0:10 - 0:16",
          purpose: "Highlight real-life convenience and core verified benefits.",
          visualDescription: `Quick cut showing the tangible result: ${benefit}. Close-up on genuine product details.`,
          voiceoverOrDialogue: `Built with ${featuresList} so you can focus on what you love.`,
          onScreenText: benefit,
        },
        {
          sceneNumber: 4,
          timestamp: "0:16 - 0:20",
          purpose: "Immediate closing call to action.",
          visualDescription: `The person smile of satisfaction, cutting to the ${productName} packshot with ${brandName} link.`,
          voiceoverOrDialogue: `Upgrade your routine today with ${brandName}.`,
          onScreenText: `Get ${productName} →`,
        },
      ],
    };
  }

  // Default: Product Showcase
  return {
    campaignIdea,
    hook,
    callToAction: `Discover ${productName} from ${brandName}. Available now.`,
    duration: 20,
    themeId,
    themeTitle,
    productName,
    brandName,
    source: "grounded-fallback",
    selectedDirection: selectedDirection ?? undefined,
    verifiedProductDetails: baseVerifiedDetails,
    storyboard: [
      {
        sceneNumber: 1,
        timestamp: "0:00 - 0:04",
        purpose: "High-energy macro hook highlighting texture and form.",
        visualDescription: `Dynamic zoom focusing on the fine texture and craftsmanship of ${productName}.`,
        voiceoverOrDialogue: hook,
        onScreenText: productName,
      },
      {
        sceneNumber: 2,
        timestamp: "0:04 - 0:10",
        purpose: "Demonstrate primary features and materials.",
        visualDescription: `Smooth 360-degree rotation of ${productName} highlighting ${featuresList}.`,
        voiceoverOrDialogue: `Every contour serves a purpose. Featuring ${featuresList}.`,
        onScreenText: featuresList,
      },
      {
        sceneNumber: 3,
        timestamp: "0:10 - 0:16",
        purpose: "Showcase the tangible performance and core benefit.",
        visualDescription: `Active demo demonstrating ${benefit} with crisp tactile feedback.`,
        voiceoverOrDialogue: `Built by ${brandName} to deliver ${benefit}.`,
        onScreenText: benefit,
      },
      {
        sceneNumber: 4,
        timestamp: "0:16 - 0:20",
        purpose: "Clear price presentation and purchase call to action.",
        visualDescription: `Hero product display with ${brandName} branding${product.price ? ` and verified price tag ${product.currency || ''}${product.price}` : ''}.`,
        voiceoverOrDialogue: `Discover ${productName}. Available now from ${brandName}.`,
        onScreenText: product.price ? `${product.name} — ${product.currency || ''}${product.price}` : `Shop ${productName}`,
      },
    ],
  };
}

/**
 * Deterministic fallback creative directions grounded strictly in available brand & product data
 */
export function buildGroundedFallbackDirections(
  brand: BrandBrain,
  product: ProductBrain,
  themeId: string,
  themeTitle: string,
  verifiedDetails?: VerifiedProductDetails | null
): CreativeDirection[] {
  const brandName = brand.brand_name || "Orbit";
  const productName = product.name || "Featured Product";
  const cleanFeatures = filterOutPlaceholderFeatures(
    verifiedDetails?.features && verifiedDetails.features.length > 0
      ? verifiedDetails.features
      : product.features
  );
  const materials = normalizeStringList(verifiedDetails?.materialsOrIngredients);
  const specs = normalizeStringList(verifiedDetails?.specifications);
  const claims = normalizeStringList(verifiedDetails?.explicitClaims);

  const factsList = [...cleanFeatures, ...materials, ...specs, ...claims].slice(0, 4);

  return [
    {
      id: "direction-1",
      title: "The Everyday Flow",
      coreIdea: `Integrate ${productName} seamlessly into the consumer's daily routine, focusing on effortless convenience and immediate lifestyle payoff.`,
      targetAudienceOrSituation: "Busy everyday buyers looking for an effortless upgrade during their daily routine or work flow.",
      hook: "Ever wonder why certain routines just feel effortless?",
      creativeRationale: "Anchoring the product in an existing daily routine builds immediate emotional resonance and lowers adoption friction.",
      relevantProductFacts: factsList.length > 0 ? factsList.slice(0, 2) : [productName],
    },
    {
      id: "direction-2",
      title: "Sensory & Craft Spotlight",
      coreIdea: `A sensory-driven showcase highlighting the texture, genuine materials, and tactile experience of ${productName}.`,
      targetAudienceOrSituation: "Quality-conscious shoppers who appreciate craftsmanship, sensory satisfaction, and meticulous details.",
      hook: `Take a closer look. You've never seen ${productName} quite like this.`,
      creativeRationale: "Extreme visual focus on textures, physical finish, and active demonstration establishes authentic value quickly.",
      relevantProductFacts: materials.length > 0 ? materials.slice(0, 2) : (factsList.length > 0 ? factsList.slice(0, 2) : [productName]),
    },
    {
      id: "direction-3",
      title: "The Uncompromising Standard",
      coreIdea: `Highlight ${brandName}'s refusal to cut corners, positioning ${productName} as the honest alternative to mass-market compromises.`,
      targetAudienceOrSituation: "Conscious shoppers seeking authentic brand integrity, trusted claims, and dependable performance.",
      hook: `Most brands talk about quality. ${brandName} built an obsession around it.`,
      creativeRationale: "Bold contrast against conventional compromises establishes authority, pride of purchase, and brand loyalty.",
      relevantProductFacts: claims.length > 0 ? claims.slice(0, 2) : factsList.slice(0, 2),
    },
  ];
}

/**
 * Generate 3 distinct creative directions for the selected product using Gemini
 */
export async function generateCreativeDirections(params: {
  brand: BrandBrain;
  product: ProductBrain;
  themeId: string;
  themeTitle: string;
  verifiedDetails?: VerifiedProductDetails | null;
}): Promise<CreativeDirection[]> {
  const { brand, product, themeId, themeTitle, verifiedDetails } = params;
  const apiKey = (process.env["GEMINI_API_KEY"] || "").trim().replace(/^["']|["']$/g, "").trim();

  const cleanFeatures = filterOutPlaceholderFeatures(
    verifiedDetails?.features && verifiedDetails.features.length > 0
      ? verifiedDetails.features
      : product.features
  );
  const verifiedDesc =
    verifiedDetails?.description && verifiedDetails.description.trim().length > 0
      ? verifiedDetails.description
      : product.description || "N/A";
  const specifications = normalizeStringList(verifiedDetails?.specifications);
  const materials = normalizeStringList(verifiedDetails?.materialsOrIngredients);
  const explicitClaims = normalizeStringList(verifiedDetails?.explicitClaims);

  const systemPrompt = `You are Orbit's executive creative director.
Your task is to generate 3 MEANINGFULLY DIFFERENT creative directions for a short video advertisement (~20s) for a verified brand and product under the selected creative theme.

CRITICAL DIVERSITY & FACTUAL GROUNDING RULES:
1. The 3 directions must represent DISTINCT advertising approaches and storytelling frameworks, NOT three slight variations of the same script. For example:
   - Approach A (Situational / Relatable): Focuses on a specific human moment, daily routine, late-night craving, work friction, or relatable problem.
   - Approach B (Sensory / Craft / Feature-Demonstration): Focuses intensely on product texture, sensory experience, materials, engineering, or active demonstration.
   - Approach C (Social / Cultural / High-Energy): Focuses on shared experience, friends, social status, humor, contrarian myth-busting, or a surprising narrative twist.
2. Ground each direction ONLY in the verified product facts and brand identity provided. DO NOT invent fake features, fake certifications, or unverified claims.
3. For 'relevantProductFacts', select only factual items from the verified features, materials, specifications, or explicit claims provided. If none are provided, keep it empty or reference only verified price/name.
4. Align with the selected Creative Theme: "${themeTitle}" (${themeId}).

JSON Output Schema required:
{
  "directions": [
    {
      "id": "direction-1",
      "title": "Short punchy title for this creative direction",
      "coreIdea": "1-2 sentence core creative thesis and narrative angle",
      "targetAudienceOrSituation": "Specific customer mindset, time of day, or use-case situation",
      "hook": "Opening 0-3 second hook (visual action or spoken line)",
      "creativeRationale": "Why this creative angle works psychologically for this product",
      "relevantProductFacts": ["array of verified product facts utilized"]
    }
  ]
}`;

  const userPrompt = `Brand Profile:
- Brand Name: ${brand.brand_name}
- Positioning: ${brand.positioning || brand.description}
- Target Audience: ${brand.target_audience.join(", ")}
- Tone of Voice: ${brand.tone.join(", ")}
- Brand Personality: ${brand.brand_personality.join(", ")}
- Key Selling Points: ${brand.key_selling_points.join(" | ")}

Verified Product Data:
- Product Name: ${product.name}
- Category: ${product.category || "General"}
- Price: ${product.price ? `${product.currency || ""} ${product.price}` : "Not listed"}
- Description: ${verifiedDesc}
- Verified Features: ${cleanFeatures.length > 0 ? cleanFeatures.join("; ") : "None explicitly listed"}
- Specifications: ${specifications.length > 0 ? specifications.join("; ") : "None explicitly listed"}
- Materials / Ingredients: ${materials.length > 0 ? materials.join("; ") : "None explicitly listed"}
- Explicit Claims & Certifications: ${explicitClaims.length > 0 ? explicitClaims.join("; ") : "None explicitly listed"}

Selected Creative Theme:
- Theme: ${themeTitle} (${themeId})

Generate exactly 3 genuinely distinct creative directions now in JSON:`;

  const { data: rawAi } = await callAiWithFallback(systemPrompt, userPrompt);
  if (rawAi && Array.isArray(rawAi["directions"]) && rawAi["directions"].length > 0) {
    const parsed: CreativeDirection[] = (rawAi["directions"] as Record<string, unknown>[]).slice(0, 3).map((d, idx) => ({
      id: String(d["id"] || `direction-${idx + 1}`),
      title: String(d["title"] || `Creative Direction ${idx + 1}`),
      coreIdea: String(d["coreIdea"] || ""),
      targetAudienceOrSituation: String(d["targetAudienceOrSituation"] || ""),
      hook: String(d["hook"] || ""),
      creativeRationale: String(d["creativeRationale"] || ""),
      relevantProductFacts: Array.isArray(d["relevantProductFacts"])
        ? (d["relevantProductFacts"] as unknown[]).map(String)
        : [],
    }));

    if (parsed.length >= 3) {
      return parsed;
    }
  }

  return buildGroundedFallbackDirections(brand, product, themeId, themeTitle, verifiedDetails);
}

/**
 * Generate an Advertising Concept using Gemini API (or grounded fallback)
 */
export async function generateAdvertisingConcept(params: {
  brand: BrandBrain;
  product: ProductBrain;
  themeId: string;
  themeTitle: string;
  duration?: number;
  verifiedDetails?: VerifiedProductDetails | null;
  selectedDirection?: CreativeDirection | null | undefined;
}): Promise<AdvertisingConcept> {
  const { brand, product, themeId, themeTitle, verifiedDetails, selectedDirection } = params;
  const duration = params.duration || 20;

  const apiKey = (process.env["GEMINI_API_KEY"] || "").trim().replace(/^["']|["']$/g, "").trim();

  // Extract clean, non-placeholder product facts
  const cleanFeatures = filterOutPlaceholderFeatures(
    verifiedDetails?.features && verifiedDetails.features.length > 0
      ? verifiedDetails.features
      : product.features
  );
  const verifiedDesc =
    verifiedDetails?.description && verifiedDetails.description.trim().length > 0
      ? verifiedDetails.description
      : product.description || "N/A";
  const specifications = normalizeStringList(verifiedDetails?.specifications);
  const materials = normalizeStringList(verifiedDetails?.materialsOrIngredients);
  const explicitClaims = normalizeStringList(verifiedDetails?.explicitClaims);

  // Grounding constraints in system prompt
  const systemPrompt = `You are Orbit's elite creative advertising director.
Your job is to generate a high-converting, brand-accurate short video advertising concept (~${duration} seconds) for a verified brand and product.

CRITICAL FACTUAL GROUNDING RULES:
1. ONLY use factual details from the provided brand and verified product information.
2. DO NOT invent product features, materials, ingredients, specifications, certifications, medical/health claims, fake discounts, or warranties not present in the data.
3. If materials or ingredients are "None explicitly listed", DO NOT invent them (e.g. do not guess '100% cotton', 'organic', or 'natural sugar').
4. If specifications are "None explicitly listed", do not invent dimensions, battery life, weight, or technical metrics.
5. If explicit claims are "None explicitly listed", do not fabricate certifications, guarantees, or clinical claims.
6. Strictly tailor the concept to the chosen Creative Theme:
   - "brand-commercial": Cinematic, premium storytelling, brand identity, mission, and mood.
   - "product-showcase": Focus on product appearance, design details, tactile features, and specifications.
   - "lifestyle-advertisement": Relatable real-world context, daily life integration, and human experience.
7. CRITICAL DIRECTION ALIGNMENT:
   If a "Chosen Creative Direction to Execute" is provided, you MUST construct the storyboard narrative arc, scenes, visual actions, voiceover, and hook around that specific direction's core idea, situation, and guiding hook.
8. NEVER reference another brand, competitor, or hallucinated product. Always use "${brand.brand_name}" and "${product.name}".

JSON Output Schema required:
{
  "campaignIdea": "1-2 sentence core creative thesis",
  "hook": "Attention-grabbing opening line or visual action (0:00 - 0:03)",
  "callToAction": "Clear closing call to action line",
  "duration": ${duration},
  "storyboard": [
    {
      "sceneNumber": 1,
      "timestamp": "0:00 - 0:04",
      "purpose": "Why this scene exists in the narrative arc",
      "visualDescription": "Detailed visual description of what viewers see",
      "voiceoverOrDialogue": "Spoken voiceover or dialogue (or None if purely visual)",
      "onScreenText": "Short text overlay on screen"
    }
  ]
}`;

  const directionSnippet = selectedDirection
    ? `\nChosen Creative Direction to Execute:
- Direction Title: ${selectedDirection.title}
- Core Creative Thesis: ${selectedDirection.coreIdea}
- Target Situation / Mindset: ${selectedDirection.targetAudienceOrSituation}
- Guiding Hook: ${selectedDirection.hook}
- Creative Rationale: ${selectedDirection.creativeRationale}
- Relevant Facts to Feature: ${selectedDirection.relevantProductFacts.join("; ") || "Verified product details"}\n`
    : "";

  const userPrompt = `Brand Profile:
- Brand Name: ${brand.brand_name}
- Positioning: ${brand.positioning || brand.description}
- Target Audience: ${brand.target_audience.join(", ")}
- Tone of Voice: ${brand.tone.join(", ")}
- Brand Personality: ${brand.brand_personality.join(", ")}
- Visual Style: ${brand.visual_identity?.style || "Modern"}
- Key Selling Points: ${brand.key_selling_points.join(" | ")}

Verified Product Data:
- Product Name: ${product.name}
- Category: ${product.category || "General"}
- Price: ${product.price ? `${product.currency || ""} ${product.price}` : "Not listed"}
- Description: ${verifiedDesc}
- Verified Features: ${cleanFeatures.length > 0 ? cleanFeatures.join("; ") : "None explicitly listed"}
- Specifications: ${specifications.length > 0 ? specifications.join("; ") : "None explicitly listed"}
- Materials / Ingredients: ${materials.length > 0 ? materials.join("; ") : "None explicitly listed"}
- Explicit Claims & Certifications: ${explicitClaims.length > 0 ? explicitClaims.join("; ") : "None explicitly listed"}

Selected Creative Theme:
- Theme: ${themeTitle} (${themeId})
- Target Duration: ~${duration} seconds
${directionSnippet}
Generate the complete advertising concept JSON with 4 distinct storyboard scenes covering the ~${duration}s duration${selectedDirection ? ` strictly following the "${selectedDirection.title}" creative direction` : ""}.`;

  const attachedVerifiedDetails = verifiedDetails
    ? {
        fetched: verifiedDetails.fetchedSuccessfully,
        url: verifiedDetails.url,
        description: verifiedDetails.description,
        features: verifiedDetails.features,
        specifications: verifiedDetails.specifications,
        materialsOrIngredients: verifiedDetails.materialsOrIngredients,
        explicitClaims: verifiedDetails.explicitClaims,
      }
    : undefined;

  const { data: rawAi, source: aiSource } = await callAiWithFallback(systemPrompt, userPrompt);
  if (rawAi && rawAi["campaignIdea"] && Array.isArray(rawAi["storyboard"])) {
    const rawScenes = rawAi["storyboard"] as Record<string, unknown>[];
    const parsedScenes: StoryboardScene[] = rawScenes.map((s, idx) => ({
      sceneNumber: typeof s["sceneNumber"] === "number" ? s["sceneNumber"] : idx + 1,
      timestamp: String(s["timestamp"] || `Scene ${idx + 1}`),
      purpose: String(s["purpose"] || "Advances the narrative"),
      visualDescription: String(s["visualDescription"] || "Product visual in action"),
      voiceoverOrDialogue: String(s["voiceoverOrDialogue"] || s["voiceover"] || s["dialogue"] || ""),
      onScreenText: String(s["onScreenText"] || ""),
    }));

    return {
      campaignIdea: String(rawAi["campaignIdea"]),
      hook: String(rawAi["hook"] || selectedDirection?.hook || "Discover something new."),
      storyboard: parsedScenes,
      callToAction: String(rawAi["callToAction"] || `Shop ${product.name} today.`),
      duration: typeof rawAi["duration"] === "number" ? rawAi["duration"] : duration,
      themeId,
      themeTitle,
      productName: product.name,
      brandName: brand.brand_name,
      source: aiSource,
      selectedDirection: selectedDirection ?? undefined,
      verifiedProductDetails: attachedVerifiedDetails,
    };
  }

  // Fallback to grounded structure
  return buildGroundedFallbackConcept(brand, product, themeId, themeTitle, verifiedDetails, selectedDirection);
}
