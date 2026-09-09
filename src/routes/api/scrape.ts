import { createFileRoute } from "@tanstack/react-router";
import { extractSiteSignals } from "@/lib/scrape.server";
import { buildBrandIntel } from "@/lib/brand-intel.server";

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
        let url = "";
        try {
          const payload = (await request.json()) as { url?: unknown };
          url = typeof payload.url === "string" ? payload.url.trim() : "";
        } catch {
          return json({ error: "Send a JSON body with a url field." }, 400);
        }
        if (!url) return json({ error: "Enter a website address to analyze." }, 400);

        try {
          const signals = await extractSiteSignals(url);
          const intel = await buildBrandIntel(signals);
          return json(intel);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "We couldn't analyze that website. Try another page.";
          console.error("scrape failed", error);
          return json({ error: message }, 422);
        }
      },
    },
  },
});
