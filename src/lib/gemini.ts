/**
 * Summarize and extract brand intelligence using Gemini API with resilient fallback.
 * @param text The raw page text or HTML snippet.
 * @param url The analyzed website URL.
 * @returns Structured marketing intelligence summary.
 */
export async function summarizeWithGemini(text: string, url?: string): Promise<{
  summary: string;
  brandIdentity: string;
  targetAudience: string;
  videoAngles: string[];
  qualifyingQuestions: string[];
}> {
  const apiKey = process.env["GEMINI_API_KEY"];
  const isKeyConfigured = apiKey && apiKey !== "YOUR_GEMINI_API_KEY" && apiKey.trim().length > 10;

  if (isKeyConfigured) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const prompt = `You are Orbit's AI Brand Strategist. Analyze this extracted website content (${url || "website"}).
Produce a JSON response with the following exact structure:
{
  "summary": "3-4 concise sentences summarizing the company, core product/service, and unique value proposition.",
  "brandIdentity": "1-2 sentences capturing brand voice and positioning.",
  "targetAudience": "Specific ICP (Ideal Customer Profile) and buyer personas.",
  "videoAngles": [
    "Angle 1: Hook + problem-solution theme",
    "Angle 2: Social proof / case study concept",
    "Angle 3: Feature demonstration or objection buster"
  ],
  "qualifyingQuestions": [
    "Qualifying question 1 for inbound DMs",
    "Qualifying question 2 for timeline/budget"
  ]
}

Website Content:
${text.slice(0, 8000)}`;

      const body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          return {
            summary: parsed.summary || "Summary extracted successfully.",
            brandIdentity: parsed.brandIdentity || "Modern, results-focused positioning.",
            targetAudience: parsed.targetAudience || "Founders and marketing teams.",
            videoAngles: Array.isArray(parsed.videoAngles) ? parsed.videoAngles : [
              "High-energy founder story",
              "Before vs After customer transformation",
              "Interactive feature walkthrough",
            ],
            qualifyingQuestions: Array.isArray(parsed.qualifyingQuestions) ? parsed.qualifyingQuestions : [
              "What is your target launch timeline?",
              "What monthly ad budget are you allocating?",
            ],
          };
        }
      }
    } catch (err) {
      console.warn("Gemini API call failed, falling back to local heuristic extraction:", err);
    }
  }

  // Resilient heuristic extraction
  const cleanSnippet = text.replace(/\s+/g, ' ').trim();
  const sentences = cleanSnippet.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
  const coreSentences = sentences.slice(0, 3).join('. ') + '.';

  const domain = url ? new URL(url).hostname.replace('www.', '') : 'this brand';

  return {
    summary: coreSentences || `Orbit extracted content from ${domain}. The platform focuses on high-converting growth channels, modern positioning, and customer acquisition.`,
    brandIdentity: `Focused and outcome-driven tone tailored for modern buyers exploring ${domain}.`,
    targetAudience: "Startups, founders, and high-growth teams seeking predictable demand generation.",
    videoAngles: [
      `Hook: "Why high-intent buyers choose ${domain} over manual workflows"`,
      `Short-form demo: 3 key workflows that speed up customer acquisition`,
      `POV video: How to convert attention into qualified pipeline in 24 hours`,
    ],
    qualifyingQuestions: [
      "What monthly customer acquisition volume are you currently targeting?",
      "Are you looking for AI video production, paid distribution, or automated DM qualification?",
    ],
  };
}
