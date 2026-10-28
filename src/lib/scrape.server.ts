/**
 * Server-only website extraction used by /api/scrape.
 * Pulls structured signals out of raw HTML with no external service.
 */

export type SiteSignals = {
  url: string;
  finalUrl: string;
  domain: string;
  title: string;
  description: string;
  siteName: string;
  themeColor: string | null;
  logo: string | null;
  ogImage: string | null;
  headings: string[];
  ctas: string[];
  navLinks: string[];
  socials: string[];
  text: string;
  wordCount: number;
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function decodeEntities(input: string) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_m, code: string) => String.fromCharCode(Number(code)));
}

function clean(value: string) {
  return decodeEntities(value.replace(/\s+/g, " ")).trim();
}

export function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("Only http and https URLs are supported.");
  if (!parsed.hostname.includes(".")) throw new Error("That does not look like a valid website address.");
  return parsed;
}

function meta(html: string, key: string, attr: "name" | "property" = "name") {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*${attr}=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return "";
}

function absolute(value: string | undefined, base: URL) {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

async function fetchHtml(target: URL, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(target.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) throw new Error(`The site responded with ${res.status}. It may block automated visits.`);
    const type = res.headers.get("content-type") ?? "";
    if (type && !/html|xml|text\/plain/i.test(type)) {
      throw new Error("That link is not a web page we can read.");
    }
    const html = (await res.text()).slice(0, 900_000);
    return { html, finalUrl: res.url || target.toString() };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The site took too long to respond. Try again or use a different page.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function extractSiteSignals(rawUrl: string): Promise<SiteSignals> {
  const target = normalizeUrl(rawUrl);
  let page: { html: string; finalUrl: string };
  try {
    page = await fetchHtml(target);
  } catch (error) {
    // Retry on the bare domain — deep links are the most common failure.
    if (target.pathname !== "/") {
      page = await fetchHtml(new URL(target.origin));
    } else {
      throw error;
    }
  }

  const { html } = page;
  const base = new URL(page.finalUrl);

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const title = clean(titleTag) || meta(html, "og:title", "property") || base.hostname;
  const description =
    meta(html, "description") || meta(html, "og:description", "property") || meta(html, "twitter:description");
  const siteName = meta(html, "og:site_name", "property") || base.hostname.replace(/^www\./, "");

  const headings = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((match) => clean((match[1] ?? "").replace(/<[^>]+>/g, " ")))
    .filter((value) => value.length > 2 && value.length < 180)
    .slice(0, 24);

  const anchors = [...html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: match[1] ?? "",
    label: clean((match[2] ?? "").replace(/<[^>]+>/g, " ")),
  }));

  const ctaWords = /(book|demo|start|try|get started|sign up|buy|pricing|contact|talk|call|quote|order|join)/i;
  const ctas = [
    ...new Set(
      anchors
        .filter((a) => a.label.length > 2 && a.label.length < 40 && ctaWords.test(a.label))
        .map((a) => a.label),
    ),
  ].slice(0, 10);

  const navLinks = [
    ...new Set(
      anchors
        .filter((a) => a.label.length > 1 && a.label.length < 32 && /^\/(?!\/)/.test(a.href))
        .map((a) => a.label),
    ),
  ].slice(0, 16);

  const socials = [
    ...new Set(
      anchors
        .map((a) => a.href)
        .filter((href) => /(instagram|facebook|linkedin|youtube|x\.com|twitter|tiktok|wa\.me|whatsapp)\./i.test(href))
        .map((href) => absolute(href, base) ?? href),
    ),
  ].slice(0, 8);

  const buttons = [...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)]
    .map((m) => clean((m[1] ?? "").replace(/<[^>]+>/g, " ")))
    .filter((v) => v.length > 2 && v.length < 40 && ctaWords.test(v));

  const themeColor = meta(html, "theme-color") || null;
  const logo =
    absolute(html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1], base) ??
    absolute(`/favicon.ico`, base);
  const ogImage = absolute(meta(html, "og:image", "property") || meta(html, "twitter:image"), base);

  const text = clean(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  );

  if (text.length < 120 && headings.length === 0 && !description) {
    throw new Error("We couldn't read meaningful content on that page — it may be fully script-rendered.");
  }

  return {
    url: target.toString(),
    finalUrl: page.finalUrl,
    domain: base.hostname.replace(/^www\./, ""),
    title,
    description,
    siteName,
    themeColor,
    logo,
    ogImage,
    headings,
    ctas: [...new Set([...ctas, ...buttons])].slice(0, 12),
    navLinks,
    socials,
    text: text.slice(0, 14_000),
    wordCount: text.split(" ").filter(Boolean).length,
  };
}
