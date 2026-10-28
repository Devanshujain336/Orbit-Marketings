import { createFileRoute } from "@tanstack/react-router";
import { crawlBrandWebsite } from "@/lib/firecrawl.server";
import { generateBrandBrain } from "@/lib/gemini-brand-brain.server";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/scrape")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let rawUrl = "";
        try {
          const payload = (await request.json()) as { url?: unknown };
          rawUrl = typeof payload.url === "string" ? payload.url.trim() : "";
        } catch {
          return json({ error: "Invalid request. Please provide a JSON payload with a url field." }, 400);
        }

        if (!rawUrl) {
          return json({ error: "Please enter a valid business website URL." }, 400);
        }

        try {
          // 1. Crawl & extract site information and visual assets
          const bundle = await crawlBrandWebsite(rawUrl);

          // 2. Use Gemini to understand and structure the Brand Brain
          const brandBrain = await generateBrandBrain(bundle);

          return json(brandBrain);
        } catch (error) {
          console.error("Brand understanding failed:", error);
          const message =
            error instanceof Error && error.message.length < 120
              ? error.message
              : "We couldn't fully understand this website. Try checking that the URL is correct.";
          return json({ error: message }, 422);
        }
      },
    },
  },
});
