import { createFileRoute } from "@tanstack/react-router";
import { generateCreativeDirections } from "@/lib/concept-generator.server";
import { fetchAndExtractProductDetails } from "@/lib/product-detail-fetcher.server";
import type { BrandBrain, ProductBrain } from "@/lib/gemini-brand-brain.server";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/directions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = (await request.json()) as {
            brand?: BrandBrain;
            product?: ProductBrain;
            themeId?: string;
            themeTitle?: string;
          };

          if (!payload.brand || !payload.product || !payload.themeId) {
            return json({ error: "Missing required brand, product, or themeId parameter." }, 400);
          }

          // Fetch verified product details using its individual product URL if available
          let verifiedDetails = null;
          if (payload.product.url) {
            try {
              verifiedDetails = await fetchAndExtractProductDetails(
                payload.product.url,
                payload.product
              );
            } catch (scrapeErr) {
              console.warn(
                `Failed to fetch detailed product page for ${payload.product.url}; continuing gracefully with basic info:`,
                scrapeErr
              );
            }
          }

          const directions = await generateCreativeDirections({
            brand: payload.brand,
            product: payload.product,
            themeId: payload.themeId,
            themeTitle: payload.themeTitle || payload.themeId,
            verifiedDetails,
          });

          return json({
            directions,
            verifiedDetails: verifiedDetails
              ? {
                  fetched: verifiedDetails.fetchedSuccessfully,
                  url: verifiedDetails.url,
                  description: verifiedDetails.description,
                  features: verifiedDetails.features,
                  specifications: verifiedDetails.specifications,
                  materialsOrIngredients: verifiedDetails.materialsOrIngredients,
                  explicitClaims: verifiedDetails.explicitClaims,
                }
              : null,
          });
        } catch (error) {
          console.error("Creative direction generation failed:", error);
          const message =
            error instanceof Error && error.message.length < 120
              ? error.message
              : "Failed to generate creative directions.";
          return json({ error: message }, 500);
        }
      },
    },
  },
});
