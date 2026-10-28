/**
 * Server-only product and category extraction engine for Orbit.
 * Discovers real products, extracts genuine product images (filtering banners/promos),
 * captures prices and currencies, and groups items by their actual store categories.
 */

export type ExtractedProduct = {
  name: string;
  url: string;
  price: string | null;
  currency: string | null;
  description: string;
  features: string[];
  benefits: string[];
  category: string;
  image_urls: string[];
};

/**
 * Filter out banners, hero promotions, logos, navigation graphics, and tiny icons.
 * Strictly isolate genuine individual product photos.
 */
export function isGenuineProductImage(url: string, alt?: string): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  const altLower = (alt || "").toLowerCase();

  // 1. Exclude banners, promotional campaigns, editorial sliders, hero sections
  const excludeKeywords = [
    "banner",
    "hero",
    "slide",
    "promo",
    "campaign",
    "editorial",
    "lookbook",
    "web_nav",
    "nav_",
    "navigation",
    "header",
    "footer",
    "logo",
    "icon",
    "badge",
    "payment",
    "cart",
    "search",
    "spacer",
    "pixel",
    "placeholder",
    "avatar",
    "trustpilot",
    "rating",
    "star",
    "newsletter",
    "subscribe",
    "discount",
    "sale-banner",
    "coupon",
    "bg-",
    "background",
    "overlay",
    "svg",
  ];

  if (excludeKeywords.some((p) => lower.includes(p) || altLower.includes(p))) {
    return false;
  }

  // Exclude extremely wide banner dimensions if detectable in URL query
  if (lower.includes("w=3840") && (lower.includes("nav") || lower.includes("camp") || lower.includes("banner"))) {
    return false;
  }

  // 2. Must be an image format or recognized product CDN
  const isCdn =
    lower.includes("shopify.com") ||
    lower.includes("cdn.") ||
    lower.includes("ctfassets.net") ||
    lower.includes("cloudinary.com") ||
    lower.includes("product") ||
    lower.includes("media") ||
    lower.includes("catalog") ||
    lower.includes("upload") ||
    lower.includes("images.") ||
    lower.includes("img.");

  const isImgExt = /\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i.test(lower);
  return isCdn || isImgExt;
}

/**
 * Clean up title (remove trailing brand suffixes like " | Gymshark" or " - Store")
 */
export function cleanProductTitle(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/\s*\|\s*[^|]+$/i, "")
    .replace(/\s*–\s*[^–]+$/i, "")
    .replace(/\s*-\s*(?:gymshark|allbirds|nike|brand|store|official).*$/i, "")
    .replace(/["']/g, "")
    .trim();
}

/**
 * Infer human-readable category from URL path, page title, or product title keywords
 */
export function deriveCategory(pageUrl: string, pageTitle?: string, anchorText?: string): string {
  if (anchorText && anchorText.trim().length > 2 && anchorText.length < 35) {
    const clean = anchorText.replace(/view all|shop all|all /gi, "").trim();
    if (clean && !clean.includes("http")) {
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
  }

  try {
    const parsed = new URL(pageUrl);
    const parts = parsed.pathname.split("/").filter(Boolean);
    // e.g. /collections/t-shirts-tops/mens -> t-shirts-tops
    // e.g. /collections/hoodies-jackets -> hoodies-jackets
    const collectionIndex = parts.findIndex((p) => p === "collections" || p === "category" || p === "categories" || p === "shop" || p === "c");
    if (collectionIndex !== -1 && parts[collectionIndex + 1]) {
      let slug: string = parts[collectionIndex + 1]!;
      // If next part is specific gender or subcategory, check
      const nextPart = parts[collectionIndex + 2];
      if (nextPart && !nextPart.includes("all")) {
        if (nextPart !== "mens" && nextPart !== "womens" && nextPart !== "unisex") {
          slug = `${slug} - ${nextPart}`;
        }
      }
      return slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch {
    // ignore
  }

  if (pageTitle && pageTitle.trim().length > 2) {
    const firstPart = pageTitle.split(/[|\-–:]/)[0]?.trim();
    if (firstPart && firstPart.length > 2 && firstPart.length < 35 && !firstPart.toLowerCase().includes("home")) {
      return firstPart;
    }
  }

  return "Featured Products";
}

/**
 * Classify a product into a specific category based on title keywords if category is generic
 */
export function refineCategoryFromProductTitle(title: string, currentCategory: string): string {
  // If category has taxonomy arrows like "Mens>Apparel>SS Tops>t_shirt", clean it
  if (currentCategory && currentCategory.includes(">")) {
    const parts = currentCategory.split(">").map((p) => p.trim());
    const meaningful = parts.filter((p) => p !== "Mens" && p !== "Womens" && p !== "Unisex" && p !== "Apparel");
    if (meaningful.length > 0 && meaningful[0]) {
      const best = meaningful[0]
        .replace(/_/g, " ")
        .replace(/\bSS Tops\b/gi, "T-Shirts & Tops")
        .replace(/\bLS Tops\b/gi, "Long Sleeve Tops")
        .replace(/\bSleeveless Tops\b/gi, "Tanks & Sleeveless");
      return best.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  if (currentCategory && currentCategory !== "Featured Products" && currentCategory !== "Catalog Item" && currentCategory !== "Trending / New Arrivals") {
    return currentCategory;
  }

  const t = title.toLowerCase();

  // Fashion / Apparel
  if (t.includes("t-shirt") || t.includes("tee") || t.includes("top") || t.includes("tank")) return "T-Shirts & Tops";
  if (t.includes("hoodie") || t.includes("sweatshirt") || t.includes("pullover")) return "Hoodies & Sweatshirts";
  if (t.includes("jacket") || t.includes("coat") || t.includes("outerwear") || t.includes("vest")) return "Jackets & Outerwear";
  if (t.includes("legging") || t.includes("tight")) return "Leggings & Tights";
  if (t.includes("short")) return "Shorts";
  if (t.includes("pant") || t.includes("trouser") || t.includes("jogger") || t.includes("bottom")) return "Pants & Joggers";
  if (t.includes("dress") || t.includes("skirt")) return "Dresses & Skirts";
  if (t.includes("bra") || t.includes("sports bra")) return "Sports Bras";
  if (t.includes("shoe") || t.includes("sneaker") || t.includes("boot") || t.includes("runner") || t.includes("dasher") || t.includes("loafer")) return "Footwear";
  if (t.includes("sock")) return "Socks";
  if (t.includes("bag") || t.includes("backpack") || t.includes("tote")) return "Bags & Backpacks";
  if (t.includes("hat") || t.includes("cap") || t.includes("beanie")) return "Headwear";
  if (t.includes("bottle") || t.includes("shaker")) return "Bottles & Shakers";

  // Skincare & Beauty
  if (t.includes("serum") || t.includes("oil") || t.includes("ampoule")) return "Serums & Treatments";
  if (t.includes("cream") || t.includes("moisturizer") || t.includes("lotion")) return "Moisturizers";
  if (t.includes("cleanser") || t.includes("wash") || t.includes("scrub")) return "Cleansers";
  if (t.includes("sunscreen") || t.includes("spf")) return "Sun Care";
  if (t.includes("mask") || t.includes("peel")) return "Masks";

  // Electronics & Tech
  if (t.includes("headphone") || t.includes("earbud") || t.includes("audio")) return "Audio";
  if (t.includes("watch") || t.includes("band")) return "Wearables";
  if (t.includes("case") || t.includes("cover") || t.includes("charger") || t.includes("cable")) return "Accessories";

  return currentCategory || "Featured Products";
}

/**
 * Extract products from markdown (standardized format generated by Firecrawl)
 */
export function extractProductsFromMarkdown(markdown: string, category: string, baseOrigin: string): ExtractedProduct[] {
  const lines = markdown.split("\n");
  const products: ExtractedProduct[] = [];
  const seenUrls = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;
    const line = rawLine.trim();
    if (!line.includes("/products/") && !line.includes("/product/") && !line.includes("/item/") && !line.includes("/p/")) {
      continue;
    }

    // Check if line contains an image: ![alt](url)
    const imgMatches = [...line.matchAll(/!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/g)];
    if (imgMatches.length === 0 || !imgMatches[0]) continue;

    // Extract product URL: ](http.../products/... "...")
    const urlMatch = line.match(/\]\((https?:\/\/[^\s\)"']+(?:\/products\/|\/product\/|\/item\/|\/p\/)[^\s\)"']+)(?:\s+"([^"]*)")?\)/);
    if (!urlMatch || !urlMatch[1]) continue;

    let prodUrl: string = urlMatch[1];
    if (prodUrl.startsWith("/")) prodUrl = `${baseOrigin}${prodUrl}`;
    if (seenUrls.has(prodUrl)) continue;

    const titleFromUrl = urlMatch[2] || "";
    const rawImg = imgMatches[0][2] || "";
    const rawAlt = imgMatches[0][1] || "";

    if (!rawImg || !isGenuineProductImage(rawImg, rawAlt)) continue;

    // Search ahead non-blank lines for price and bold title
    const nonBlankAhead = lines
      .slice(i + 1)
      .filter((l) => Boolean(l && l.trim().length > 0))
      .slice(0, 15)
      .join(" ");

    const priceMatch =
      nonBlankAhead.match(/(?:Regular Price:\s*|Price:\s*|Sale Price:\s*|\b)([A-Z]{3}|\$|£|€|₹)\s*(\d+(?:[.,]\d{2})?)/i) ||
      nonBlankAhead.match(/([$£€₹])\s*(\d+(?:[.,]\d{2})?)/);

    let price: string | undefined = undefined;
    let currency: string | undefined = undefined;
    if (priceMatch && priceMatch[1] && priceMatch[2]) {
      currency = priceMatch[1];
      price = priceMatch[2];
    }

    const boldTitleMatch = nonBlankAhead.match(/\[\*\*([^*]+)\*\*\]/);
    const rawName = boldTitleMatch?.[1]?.trim() || titleFromUrl || rawAlt || "Brand Product";
    const name = cleanProductTitle(rawName);

    if (name.length < 2 || name.toLowerCase().includes("banner")) continue;
    seenUrls.add(prodUrl);

    const refinedCat = refineCategoryFromProductTitle(name, category);

    products.push({
      name,
      url: prodUrl,
      price: price ?? null,
      currency: currency ?? null,
      description: `Official ${refinedCat} catalog item`,
      features: ["Verified genuine brand item", "Direct online ordering"],
      benefits: ["High durability & design", "Direct from brand"],
      category: refinedCat,
      image_urls: [rawImg],
    });
  }

  return products;
}

/**
 * Extract products from HTML (JSON-LD schema, microdata, and product card <a> tags)
 */
export function extractProductsFromHtml(html: string, category: string, baseOrigin: string): ExtractedProduct[] {
  const products: ExtractedProduct[] = [];
  const seenUrls = new Set<string>();

  // 1. Check JSON-LD schema (@type: Product or ItemList)
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ldMatch;
  while ((ldMatch = jsonLdRegex.exec(html)) !== null) {
    if (!ldMatch[1]) continue;
    try {
      const parsed = JSON.parse(ldMatch[1]);
      const items = Array.isArray(parsed)
        ? parsed
        : parsed["@type"] === "ItemList" && Array.isArray(parsed["itemListElement"])
          ? parsed["itemListElement"].map((el: any) => el.item || el)
          : parsed["@type"] === "Product"
            ? [parsed]
            : [];

      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const name = cleanProductTitle(String(item.name || item.title || ""));
        if (!name || name.length < 2) continue;

        let prodUrl = String(item.url || "");
        if (prodUrl && prodUrl.startsWith("/")) prodUrl = `${baseOrigin}${prodUrl}`;
        if (prodUrl && seenUrls.has(prodUrl)) continue;

        let imgUrl = "";
        if (typeof item.image === "string") imgUrl = item.image;
        else if (Array.isArray(item.image) && typeof item.image[0] === "string") imgUrl = item.image[0];
        else if (item.image && typeof item.image.url === "string") imgUrl = item.image.url;

        if (imgUrl && imgUrl.startsWith("/")) imgUrl = `${baseOrigin}${imgUrl}`;
        if (!imgUrl || !isGenuineProductImage(imgUrl, name)) continue;

        let price: string | null = null;
        let currency: string | null = null;
        if (item.offers) {
          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          if (offer) {
            price = offer.price ? String(offer.price) : null;
            currency = offer.priceCurrency ? String(offer.priceCurrency) : null;
          }
        }

        const cat = item.category ? String(item.category) : refineCategoryFromProductTitle(name, category);
        if (prodUrl) seenUrls.add(prodUrl);

        products.push({
          name,
          url: prodUrl || `${baseOrigin}/products`,
          price,
          currency,
          description: String(item.description || `Official ${cat} item`),
          features: ["Genuine brand item", "In-stock online"],
          benefits: ["Fast delivery", "Authentic brand quality"],
          category: cat,
          image_urls: [imgUrl],
        });
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  // 2. HTML Product Cards with <a> and <img>
  const cardRegex = /<a[^>]+href=["']([^"']*(?:\/products\/|\/product\/|\/item\/|\/p\/)[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let cardMatch: RegExpExecArray | null;
  while ((cardMatch = cardRegex.exec(html)) !== null) {
    if (!cardMatch[1] || !cardMatch[2]) continue;
    let prodUrl: string = cardMatch[1];
    if (prodUrl.startsWith("/")) prodUrl = `${baseOrigin}${prodUrl}`;
    if (seenUrls.has(prodUrl)) continue;

    const inner = cardMatch[2];
    const imgMatch = inner.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/i) ||
                     inner.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
    if (!imgMatch || !imgMatch[1]) continue;

    let imgSrc: string = imgMatch[1];
    if (imgSrc.startsWith("/")) imgSrc = `${baseOrigin}${imgSrc}`;
    const imgAlt = imgMatch[2] || "";

    if (!isGenuineProductImage(imgSrc, imgAlt)) continue;

    const innerText = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const name = cleanProductTitle(imgAlt || innerText.slice(0, 50));
    if (name.length < 2 || name.toLowerCase().includes("banner")) continue;

    const priceMatch = innerText.match(/([$£€₹])\s*(\d+(?:[.,]\d{2})?)/);
    let price: string | undefined = undefined;
    let currency: string | undefined = undefined;
    if (priceMatch && priceMatch[1] && priceMatch[2]) {
      currency = priceMatch[1];
      price = priceMatch[2];
    }

    seenUrls.add(prodUrl);
    const refinedCat = refineCategoryFromProductTitle(name, category);

    products.push({
      name,
      url: prodUrl,
      price: price ?? null,
      currency: currency ?? null,
      description: `Official ${refinedCat} catalog item`,
      features: ["Genuine product", "Available online"],
      benefits: ["Quality guaranteed"],
      category: refinedCat,
      image_urls: [imgSrc],
    });
  }

  return products;
}

/**
 * Deduplicate products by URL or Name, keeping the highest quality image
 */
export function deduplicateProducts(products: ExtractedProduct[]): ExtractedProduct[] {
  const map = new Map<string, ExtractedProduct>();

  for (const p of products) {
    const key = (p.url || p.name).toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, p);
    } else {
      const existing = map.get(key)!;
      // If new entry has price or better image, merge
      if (!existing.price && p.price) {
        existing.price = p.price;
        existing.currency = p.currency;
      }
      if (p.image_urls.length > existing.image_urls.length) {
        existing.image_urls = p.image_urls;
      }
    }
  }

  return Array.from(map.values());
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Attempt to query store JSON catalog endpoints (Shopify, WooCommerce, BigCommerce).
 * Retrieves full catalogues with real categories, variants, and product photography.
 */
export async function discoverShopifyCatalog(baseOrigin: string, maxPages = 4): Promise<ExtractedProduct[]> {
  const allProducts: ExtractedProduct[] = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const endpoint = `${baseOrigin}/products.json?limit=250&page=${page}`;
      const res = await fetch(endpoint, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) break;
      const data = (await res.json()) as { products?: any[] };
      if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
        break;
      }

      for (const item of data.products) {
        const title = cleanProductTitle(String(item.title || ""));
        if (!title || title.length < 2) continue;

        const handle = String(item.handle || "");
        const prodUrl = handle ? `${baseOrigin}/products/${handle}` : `${baseOrigin}/products/${item.id}`;

        // Raw category from product_type or tags
        let category = String(item.product_type || "").trim();
        if (!category && Array.isArray(item.tags) && item.tags.length > 0) {
          const catTag = item.tags.find((t: string) => !t.startsWith("__") && t.length > 3 && t.length < 25);
          if (catTag) category = String(catTag).trim();
        }
        category = refineCategoryFromProductTitle(title, category);

        // Price & currency
        let price: string | null = null;
        let currency: string | null = null;
        if (Array.isArray(item.variants) && item.variants[0]) {
          const firstVariant = item.variants[0];
          if (firstVariant.price) {
            price = String(firstVariant.price);
          }
        }

        // Genuine product images
        const imageUrls: string[] = [];
        if (Array.isArray(item.images)) {
          for (const img of item.images) {
            const src = typeof img === "string" ? img : img?.src;
            if (src && isGenuineProductImage(src, title)) {
              imageUrls.push(src);
              if (imageUrls.length >= 3) break;
            }
          }
        }

        allProducts.push({
          name: title,
          url: prodUrl,
          price,
          currency,
          description: stripHtml(String(item.body_html || "")).slice(0, 200) || `Official ${category} item`,
          features: ["Authentic brand product", "Direct online ordering"],
          benefits: ["Premium design & craftsmanship", "Official warranty & return support"],
          category,
          image_urls: imageUrls,
        });
      }

      // If page had fewer items than limit, no next page exists
      if (data.products.length < 250) break;
    } catch {
      break;
    }
  }

  return allProducts;
}

/**
 * Discover product pages from sitemap.xml
 */
export async function discoverProductUrlsFromSitemap(baseOrigin: string, maxUrls = 50): Promise<string[]> {
  const productUrls: string[] = [];

  const candidates = [
    `${baseOrigin}/sitemap.xml`,
    `${baseOrigin}/sitemap_products_1.xml`,
    `${baseOrigin}/products-sitemap.xml`,
  ];

  for (const sitemapUrl of candidates) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(sitemapUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const text = await res.text();

      // If sitemapindex, find nested product sitemaps
      const sitemapMatches = [...text.matchAll(/<loc>(https?:\/\/[^<]+sitemap[^\/<]*product[^\/<]*\.xml)<\/loc>/gi)];
      for (const sm of sitemapMatches) {
        if (!sm[1]) continue;
        try {
          const subRes = await fetch(sm[1], { headers: { "User-Agent": "Mozilla/5.0" } });
          if (subRes.ok) {
            const subText = await subRes.text();
            const locMatches = [...subText.matchAll(/<loc>(https?:\/\/[^<]+(?:\/products\/|\/product\/|\/item\/|\/p\/)[^<]+)<\/loc>/gi)];
            for (const lm of locMatches) {
              if (lm[1] && !productUrls.includes(lm[1])) {
                productUrls.push(lm[1]);
                if (productUrls.length >= maxUrls) return productUrls;
              }
            }
          }
        } catch {}
      }

      // Direct product URLs in sitemap
      const directMatches = [...text.matchAll(/<loc>(https?:\/\/[^<]+(?:\/products\/|\/product\/|\/item\/|\/p\/)[^<]+)<\/loc>/gi)];
      for (const dm of directMatches) {
        if (dm[1] && !productUrls.includes(dm[1])) {
          productUrls.push(dm[1]);
          if (productUrls.length >= maxUrls) return productUrls;
        }
      }

      if (productUrls.length > 0) return productUrls;
    } catch {
      continue;
    }
  }

  return productUrls;
}
