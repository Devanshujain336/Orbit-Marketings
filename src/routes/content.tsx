import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/orbit/workspace-pages";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Orbit Content Pipeline" },
      { name: "description", content: "Create AI-generated video drafts or request offline shoots for Orbit campaigns." },
      { property: "og:title", content: "Orbit Content Pipeline" },
      { property: "og:description", content: "Manage Orbit video ideas, production, drafts, scheduled posts, and published assets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContentPage,
});
