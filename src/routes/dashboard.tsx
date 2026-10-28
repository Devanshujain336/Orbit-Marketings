import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/orbit/workspace-pages";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Orbit Dashboard — Pit Wall" },
      { name: "description", content: "Orbit dashboard for content, distribution, spend, and qualified lead signals." },
      { property: "og:title", content: "Orbit Dashboard — Pit Wall" },
      { property: "og:description", content: "A telemetry workspace for startup content, distribution, and lead qualification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});
