import { createFileRoute } from "@tanstack/react-router";
import { LeadsPage } from "@/components/orbit/workspace-pages";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Orbit Lead Qualification" },
      { name: "description", content: "Score inbound WhatsApp and Instagram leads into high, medium, and low priority tiers." },
      { property: "og:title", content: "Orbit Lead Qualification" },
      { property: "og:description", content: "Reply instantly to inbound leads and route only high-value buyers to founders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeadsPage,
});
