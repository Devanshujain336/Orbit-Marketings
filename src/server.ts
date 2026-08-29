import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { summarizeWithGemini } from "./lib/gemini";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // Handle scraping API endpoint
    if (request.method === "POST" && request.url.includes("/api/scrape")) {
      try {
        const { url: targetUrl } = await request.json();
        if (!targetUrl) throw new Error("Missing URL");
        const pageRes = await fetch(targetUrl);
        const html = await pageRes.text();

        // Extract meta information for better heuristic fallback
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : "";
        
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) 
          || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
          || html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)
          || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
        const description = descMatch ? descMatch[1].trim() : "";

        const plain = html
          .replace(/<script[^>]*>.*?<\/script>/gs, " ")
          .replace(/<style[^>]*>.*?<\/style>/gs, " ")
          .replace(/<nav[^>]*>.*?<\/nav>/gis, " ")
          .replace(/<header[^>]*>.*?<\/header>/gis, " ")
          .replace(/<footer[^>]*>.*?<\/footer>/gis, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const data = await summarizeWithGemini(plain, targetUrl, title, description);
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error(e);
        return new Response(JSON.stringify({ error: e.message || "Failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
