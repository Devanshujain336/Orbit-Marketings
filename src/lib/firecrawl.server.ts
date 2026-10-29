/**
 * Server-only Firecrawl crawler and scraper for Orbit.
 * Extracts brand info, prioritized subpages (shop, products, about, faq),
 * and clean visual assets (products, logos, lifestyle imagery) while filtering tracking pixels and UI icons.
 */

export type ScrapedVisualAsset = {
  url: string;
  alt?: string | undefined;
  type: "product" | "logo" | "brand" | "general";
};

export type ScrapedPageData = {
  url: string;
  title: string;
  description: string;
  markdown: string;
  html?: string | undefined;
  links: string[];
  visualAssets: ScrapedVisualAsset[];
};

import {
  extractProductsFromMarkdown,
  extractProductsFromHtml,
  deriveCategory,
  deduplicateProducts,
  discoverShopifyCatalog,
  discoverProductUrlsFromSitemap,
  type ExtractedProduct,
} from "./product-extractor.server";

export type ScrapedBrandBundle = {
  mainUrl: string;
  finalUrl: string;
  domain: string;
  brandNameGuess: string;
  title: string;
  description: string;
  logo: string | null;
  ogImage: string | null;
  pages: ScrapedPageData[];
  allImages: string[];
  socialLinks: string[];
  combinedContent: string;
  usedFirecrawl: boolean;
  discoveredProducts: ExtractedProduct[];
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function normalizeUrl(raw: string): URL {
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS website URLs are supported.");
  }
  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    throw new Error("Please enter a valid website domain (e.g. https://yourbrand.com).");
  }
  return parsed;
}

function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Filter out tracking pixels, tiny badges, payment icons, and UI svgs
 */
export function isLikelyContentImage(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();

  // Exclude data URIs unless reasonably sized image
  if (lower.startsWith("data:") && !lower.startsWith("data:image/jpeg") && !lower.startsWith("data:image/png")) {
    return false;
  }

  // Tracking pixels and analytics
  if (
    lower.includes("1x1") ||
    lower.includes("pixel") ||
    lower.includes("beacon") ||
    lower.includes("analytics") ||
    lower.includes("track") ||
    lower.includes("facebook.com/tr") ||
    lower.includes("bat.bing") ||
    lower.includes("doubleclick") ||
    lower.includes("google-analytics") ||
    lower.includes("stats") ||
    lower.includes("spacer.gif") ||
    lower.includes("blank.gif")
  ) {
    return false;
  }

  // Low-relevance UI icons
  if (
    lower.endsWith(".svg") &&
    (lower.includes("icon") || lower.includes("arrow") || lower.includes("chevron") || lower.includes("star") || lower.includes("close") || lower.includes("cart") || lower.includes("search"))
  ) {
    return false;
  }

  // Must have a valid web extension or image path
  const validExtensions = /\.(jpg|jpeg|png|webp|avif|gif)(\?.*)?$/i;
  const imageKeywords = /(cdn|upload|image|product|photo|media|assets|photo|collection|img)/i;

  return validExtensions.test(lower) || imageKeywords.test(lower);
}

function resolveUrl(relative: string | undefined | null, base: URL): string | null {
  if (!relative) return null;
  try {
    const resolved = new URL(relative, base);
    return resolved.toString();
  } catch {
    return null;
  }
}

function extractImagesFromHtml(html: string, base: URL): ScrapedVisualAsset[] {
  const assets: ScrapedVisualAsset[] = [];
  const seen = new Set<string>();

  // 1. Check og:image and twitter:image
  const ogMatches = html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']/gi);
  for (const match of ogMatches) {
    const rawContent = match[1] || "";
    const src = resolveUrl(rawContent, base);
    if (src && isLikelyContentImage(src) && !seen.has(src)) {
      seen.add(src);
      assets.push({ url: src, type: "brand", alt: "Brand image" });
    }
  }

  // 2. Check <img> tags
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  for (const match of imgMatches) {
    const fullTag = match[0];
    const rawSrc = match[1] || "";
    const altMatch = fullTag.match(/alt=["']([^"']*)["']/i);
    const alt = altMatch && altMatch[1] ? cleanText(altMatch[1]) : "";

    const src = resolveUrl(rawSrc, base);
    if (!src || !isLikelyContentImage(src) || seen.has(src)) continue;

    seen.add(src);

    const isProduct = /(product|shop|item|sku|collection|variant)/i.test(src) || /(product|shirt|dress|hoodie|pant|shoe|bottle|bag|watch|pack|serum|cream|device)/i.test(alt);
    const isLogo = /(logo|brand|icon)/i.test(src) || /(logo|brand)/i.test(alt);

    assets.push({
      url: src,
      alt,
      type: isLogo ? "logo" : isProduct ? "product" : "general",
    });
  }

  // 3. Check srcset for high-res images
  const srcsetMatches = html.matchAll(/srcset=["']([^"']+)["']/gi);
  for (const match of srcsetMatches) {
    const rawSrcset = match[1] || "";
    const set = rawSrcset.split(",");
    const lastItem = set[set.length - 1]?.trim().split(/\s+/)[0];
    if (lastItem) {
      const src = resolveUrl(lastItem, base);
      if (src && isLikelyContentImage(src) && !seen.has(src)) {
        seen.add(src);
        assets.push({ url: src, type: "product", alt: "" });
      }
    }
  }

  return assets;
}

function extractImagesFromMarkdown(markdown: string, base: URL): ScrapedVisualAsset[] {
  const assets: ScrapedVisualAsset[] = [];
  const seen = new Set<string>();

  const mdImgMatches = markdown.matchAll(/!\[(.*?)\]\((.*?)\)/g);
  for (const match of mdImgMatches) {
    const alt = cleanText(match[1] || "");
    const rawSrc = (match[2] || "").split(/\s+/)[0] || "";
    const src = resolveUrl(rawSrc, base);

    if (src && isLikelyContentImage(src) && !seen.has(src)) {
      seen.add(src);
      const isProduct = /(product|shop|item|sku|collection|variant)/i.test(src) || alt.length > 2;
      const isLogo = /(logo|brand)/i.test(src) || /(logo|brand)/i.test(alt);

      assets.push({
        url: src,
        alt,
        type: isLogo ? "logo" : isProduct ? "product" : "general",
      });
    }
  }
  return assets;
}

function extractSocialLinks(links: string[]): string[] {
  const socialDomains = ["instagram.com", "facebook.com", "twitter.com", "x.com", "linkedin.com", "youtube.com", "tiktok.com", "wa.me", "whatsapp.com", "pinterest.com"];
  const found = new Set<string>();

  for (const link of links) {
    try {
      const parsed = new URL(link);
      if (socialDomains.some((d) => parsed.hostname.includes(d))) {
        // Exclude generic share links
        if (!link.includes("share") && !link.includes("intent/tweet")) {
          found.add(link);
        }
      }
    } catch {
      // ignore
    }
  }
  return Array.from(found).slice(0, 10);
}

/**
 * Identify high-value internal links: Products, Shop, About, FAQ, Contact, Collections
 */
function prioritizeLinks(links: string[], origin: string): { productLinks: string[]; brandLinks: string[]; otherLinks: string[] } {
  const productLinks: string[] = [];
  const brandLinks: string[] = [];
  const otherLinks: string[] = [];

  const seen = new Set<string>();

  for (const raw of links) {
    try {
      const url = new URL(raw, origin);
      if (url.origin !== origin) continue;
      const path = url.pathname.toLowerCase();

      // Normalize without trailing slash
      const cleanPath = path.replace(/\/$/, "") || "/";
      if (cleanPath === "" || cleanPath === "/" || seen.has(cleanPath)) continue;
      seen.add(cleanPath);

      if (/(product|shop|collection|catalog|item|store|buy)/i.test(path)) {
        productLinks.push(url.toString());
      } else if (/(about|story|mission|faq|help|contact|shipping|returns|values|terms)/i.test(path)) {
        brandLinks.push(url.toString());
      } else {
        otherLinks.push(url.toString());
      }
    } catch {
      // ignore
    }
  }

  return { productLinks, brandLinks, otherLinks };
}

/**
 * Call Firecrawl Scrape API
 */
export async function scrapeWithFirecrawl(url: string, apiKey: string, timeoutMs = 15000): Promise<{
  markdown: string;
  html?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  ogImage?: string | undefined;
  favicon?: string | undefined;
  links: string[];
} | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        url,
        formats: ["markdown", "html", "links"],
        onlyMainContent: false,
      }),
    });

    if (!res.ok) {
      console.warn(`Firecrawl scrape failed (${res.status}) for ${url}`);
      return null;
    }

    const json = (await res.json()) as {
      success?: boolean;
      data?: {
        markdown?: string;
        html?: string;
        metadata?: {
          title?: string;
          description?: string;
          ogImage?: string;
          favicon?: string;
          sourceURL?: string;
        };
        links?: string[];
      };
    };

    if (json.data) {
      return {
        markdown: json.data.markdown || "",
        html: json.data.html || "",
        title: json.data.metadata?.title || "",
        description: json.data.metadata?.description || "",
        ogImage: json.data.metadata?.ogImage || "",
        favicon: json.data.metadata?.favicon || "",
        links: json.data.links || [],
      };
    }
    return null;
  } catch (err) {
    console.warn("Firecrawl scrape error:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fallback Direct Scraper if Firecrawl is not configured or fails
 */
export async function fallbackDirectScrape(target: URL, timeoutMs = 12000): Promise<{
  markdown: string;
  html: string;
  title: string;
  description: string;
  ogImage: string;
  favicon: string;
  links: string[];
  finalUrl: string;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(target.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      throw new Error(`The website responded with status ${res.status}. It may be private or blocking automated visits.`);
    }

    const html = (await res.text()).slice(0, 1_200_000);
    const finalUrl = res.url || target.toString();
    const base = new URL(finalUrl);

    // Extract basic metadata
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch && titleMatch[1] ? cleanText(titleMatch[1]) : "";

    const meta = (name: string) => {
      const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i")) ||
                html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["']`, "i"));
      return m && m[1] ? cleanText(m[1]) : "";
    };

    const description = meta("description") || meta("og:description") || meta("twitter:description");
    const ogImage = resolveUrl(meta("og:image") || meta("twitter:image"), base) || "";
    const favicon = resolveUrl(html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1] || "/favicon.ico", base) || "";

    // Extract links
    const linkMatches = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)];
    const links: string[] = [];
    for (const match of linkMatches) {
      const resolved = resolveUrl(match[1], base);
      if (resolved) links.push(resolved);
    }

    // Convert HTML to simplified text/markdown
    const bodyText = cleanText(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
        .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
        .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
        .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n* $1")
        .replace(/<[^>]+>/g, " ")
    );

    return {
      markdown: bodyText.slice(0, 18000),
      html,
      title,
      description,
      ogImage,
      favicon,
      links: [...new Set(links)],
      finalUrl,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Crawls and compiles the complete brand understanding scrape bundle
 */
export async function crawlBrandWebsite(rawUrl: string): Promise<ScrapedBrandBundle> {
  const target = normalizeUrl(rawUrl);
  const firecrawlKey = (process.env["FIRECRAWL_API_KEY"] || "").trim().replace(/^["']|["']$/g, "").trim();

  let finalUrl = target.toString();
  let domain = target.hostname.replace(/^www\./, "");
  let title = "";
  let description = "";
  let logo: string | null = null;
  let ogImage: string | null = null;
  const pages: ScrapedPageData[] = [];
  const allImagesSet = new Set<string>();
  const allLinksSet = new Set<string>();
  let usedFirecrawl = false;

  // 1. Scrape Homepage
  if (firecrawlKey && firecrawlKey.trim().length > 10 && firecrawlKey !== "YOUR_FIRECRAWL_API_KEY") {
    const fcHome = await scrapeWithFirecrawl(target.toString(), firecrawlKey);
    if (fcHome) {
      usedFirecrawl = true;
      title = fcHome.title || "";
      description = fcHome.description || "";
      ogImage = fcHome.ogImage || null;
      logo = fcHome.favicon || null;

      const visualAssets = [
        ...extractImagesFromHtml(fcHome.html || "", target),
        ...extractImagesFromMarkdown(fcHome.markdown || "", target),
      ];

      visualAssets.forEach((v) => allImagesSet.add(v.url));
      fcHome.links.forEach((l) => allLinksSet.add(l));

      pages.push({
        url: target.toString(),
        title: title || domain,
        description,
        markdown: fcHome.markdown,
        html: fcHome.html,
        links: fcHome.links,
        visualAssets,
      });
    }
  }

  // Fallback for homepage if Firecrawl wasn't used or failed
  if (pages.length === 0) {
    const direct = await fallbackDirectScrape(target);
    finalUrl = direct.finalUrl;
    domain = new URL(finalUrl).hostname.replace(/^www\./, "");
    title = direct.title || domain;
    description = direct.description;
    logo = direct.favicon || null;
    ogImage = direct.ogImage || null;

    const visualAssets = [
      ...extractImagesFromHtml(direct.html, new URL(finalUrl)),
      ...extractImagesFromMarkdown(direct.markdown, new URL(finalUrl)),
    ];

    visualAssets.forEach((v) => allImagesSet.add(v.url));
    direct.links.forEach((l) => allLinksSet.add(l));

    pages.push({
      url: finalUrl,
      title,
      description,
      markdown: direct.markdown,
      html: direct.html,
      links: direct.links,
      visualAssets,
    });
  }

  // 2. Discover and Scrape Key Pages (Prioritize Category Collections and Brand Pages)
  const baseOrigin = new URL(finalUrl).origin;
  const allDiscoveredProducts: ExtractedProduct[] = [];

  // Tier 1: Try Store API Catalog (Shopify / Headless e-commerce catalog endpoints)
  try {
    const apiCatalog = await discoverShopifyCatalog(baseOrigin, 4);
    if (apiCatalog.length > 0) {
      allDiscoveredProducts.push(...apiCatalog);
    }
  } catch (err) {
    console.warn("Direct catalog API probe skipped:", err);
  }

  // Tier 2: Extract products from the homepage
  if (pages[0]) {
    const homeProdsFromMd = extractProductsFromMarkdown(pages[0].markdown, "Trending / Featured", baseOrigin);
    const homeProdsFromHtml = extractProductsFromHtml(pages[0].html || "", "Trending / Featured", baseOrigin);
    allDiscoveredProducts.push(...homeProdsFromMd, ...homeProdsFromHtml);
  }

  // Filter category/collection links across the entire store
  const categoryLinkCandidates = Array.from(allLinksSet).filter((l) => {
    try {
      const u = new URL(l, baseOrigin);
      if (u.origin !== baseOrigin) return false;
      const path = u.pathname.toLowerCase();
      const isCat = /(collections|category|categories|shop|catalog|department)\//i.test(path);
      const isUtility = /(banner|account|cart|login|privacy|terms|policy|faq|help|contact|search)/i.test(path);
      return isCat && !isUtility;
    } catch {
      return false;
    }
  });

  // Deduplicate category links by base path
  const seenCatSlugs = new Set<string>();
  const distinctCategoryUrls: string[] = [];
  for (const rawCat of categoryLinkCandidates) {
    if (!rawCat) continue;
    try {
      const cleanUrl = (rawCat.split("?")[0] || "").replace(/\/$/, "");
      if (!cleanUrl) continue;
      const slug = cleanUrl.split("/").slice(-2).join("/");
      if (!seenCatSlugs.has(slug)) {
        seenCatSlugs.add(slug);
        distinctCategoryUrls.push(cleanUrl);
      }
    } catch {}
  }

  // Find individual product links for fallback deep product crawling
  const directProductLinks = Array.from(allLinksSet).filter((l) => {
    try {
      const u = new URL(l, baseOrigin);
      return u.origin === baseOrigin && /(products|product|item|p)\//i.test(u.pathname);
    } catch {
      return false;
    }
  });

  // If few products found so far, discover product URLs via sitemaps
  if (allDiscoveredProducts.length < 15) {
    try {
      const sitemapProductUrls = await discoverProductUrlsFromSitemap(baseOrigin, 20);
      sitemapProductUrls.forEach((u) => {
        if (!directProductLinks.includes(u)) {
          directProductLinks.push(u);
        }
      });
    } catch {}
  }

  const prioritized = prioritizeLinks(Array.from(allLinksSet), baseOrigin);

  // Subpages to scrape: up to 6 category collections + 1 brand/about page + individual product pages if needed
  const subpagesToScrape: { url: string; type: "category" | "product" | "brand" }[] = [
    ...distinctCategoryUrls.slice(0, 6).map((url) => ({ url, type: "category" as const })),
    ...prioritized.brandLinks.slice(0, 1).map((url) => ({ url, type: "brand" as const })),
  ];

  // If still fewer than 15 products found, add direct product links
  if (allDiscoveredProducts.length < 15 && directProductLinks.length > 0) {
    subpagesToScrape.push(
      ...directProductLinks.slice(0, 8).map((url) => ({ url, type: "product" as const }))
    );
  }

  if (subpagesToScrape.length > 0) {
    const subpagePromises = subpagesToScrape.map(async ({ url: pageUrl, type: pageType }) => {
      try {
        let pageData: ScrapedPageData | null = null;

        if (usedFirecrawl && firecrawlKey) {
          const fcSub = await scrapeWithFirecrawl(pageUrl, firecrawlKey);
          if (fcSub) {
            const visualAssets = [
              ...extractImagesFromHtml(fcSub.html || "", new URL(pageUrl)),
              ...extractImagesFromMarkdown(fcSub.markdown || "", new URL(pageUrl)),
            ];
            pageData = {
              url: pageUrl,
              title: fcSub.title || pageUrl,
              description: fcSub.description || "",
              markdown: fcSub.markdown || "",
              html: fcSub.html,
              links: fcSub.links || [],
              visualAssets,
            };
          }
        }

        if (!pageData) {
          const directSub = await fallbackDirectScrape(new URL(pageUrl), 8000);
          const visualAssets = [
            ...extractImagesFromHtml(directSub.html, new URL(pageUrl)),
            ...extractImagesFromMarkdown(directSub.markdown, new URL(pageUrl)),
          ];
          pageData = {
            url: pageUrl,
            title: directSub.title || pageUrl,
            description: directSub.description,
            markdown: directSub.markdown,
            html: directSub.html,
            links: directSub.links,
            visualAssets,
          };
        }

        if (pageData) {
          // Extract products from category/product page
          const categoryName = deriveCategory(pageUrl, pageData.title);
          const prodsFromMd = extractProductsFromMarkdown(pageData.markdown, categoryName, baseOrigin);
          const prodsFromHtml = extractProductsFromHtml(pageData.html || "", categoryName, baseOrigin);
          allDiscoveredProducts.push(...prodsFromMd, ...prodsFromHtml);

          return pageData;
        }
        return null;
      } catch (err) {
        console.warn(`Could not scrape subpage ${pageUrl}:`, err);
        return null;
      }
    });

    const subpageResults = await Promise.allSettled(subpagePromises);
    for (const result of subpageResults) {
      if (result.status === "fulfilled" && result.value) {
        pages.push(result.value);
        result.value.visualAssets.forEach((v) => allImagesSet.add(v.url));
        result.value.links.forEach((l) => allLinksSet.add(l));
      }
    }
  }

  // Deduplicate and filter visual assets
  const socialLinks = extractSocialLinks(Array.from(allLinksSet));
  const brandNameGuess = title.split(/[|\-–:]/)[0]?.trim() || domain;

  // Deduplicate products
  const finalDiscoveredProducts = deduplicateProducts(allDiscoveredProducts);

  // Build combined markdown representation for Gemini
  let combinedContent = `WEBSITE URL: ${finalUrl}\nDOMAIN: ${domain}\nMAIN TITLE: ${title}\nMETA DESCRIPTION: ${description}\n\n`;

  // Include discovered products summary for Gemini
  if (finalDiscoveredProducts.length > 0) {
    combinedContent += `--- EXTRACTED STORE PRODUCTS (${finalDiscoveredProducts.length} items) ---\n`;
    finalDiscoveredProducts.slice(0, 40).forEach((p, idx) => {
      combinedContent += `Item #${idx + 1}: ${p.name} | Category: ${p.category} | Price: ${p.currency || ""}${p.price || "N/A"} | URL: ${p.url}\n`;
      if (p.image_urls.length > 0) combinedContent += `  Image: ${p.image_urls[0]}\n`;
    });
    combinedContent += `\n`;
  }

  pages.forEach((p, idx) => {
    combinedContent += `--- PAGE ${idx + 1}: ${p.url} (${p.title}) ---\n`;
    if (p.description) combinedContent += `Description: ${p.description}\n`;
    combinedContent += `${p.markdown.slice(0, 8000)}\n\n`;
  });

  return {
    mainUrl: target.toString(),
    finalUrl,
    domain,
    brandNameGuess,
    title,
    description,
    logo,
    ogImage,
    pages,
    allImages: Array.from(allImagesSet).slice(0, 50),
    socialLinks,
    combinedContent: combinedContent.slice(0, 60000),
    usedFirecrawl,
    discoveredProducts: finalDiscoveredProducts,
  };
}

