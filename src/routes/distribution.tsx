import { createFileRoute } from "@tanstack/react-router";
import { DistributionPage } from "@/components/orbit/workspace-pages";

export const Route = createFileRoute("/distribution")({
  head: () => ({
    meta: [
      { title: "Orbit Distribution Calendar" },
      { name: "description", content: "Schedule Orbit videos and ad boosts across Instagram and Facebook." },
      { property: "og:title", content: "Orbit Distribution Calendar" },
      { property: "og:description", content: "Plan publishing times, audiences, platforms, and campaign boosts in Orbit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DistributionPage,
});
