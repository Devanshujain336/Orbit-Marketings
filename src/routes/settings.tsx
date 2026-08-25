import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/orbit/workspace-pages";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Orbit Settings" },
      { name: "description", content: "Manage Orbit demo workspace channels, reply tone, and business operating rules." },
      { property: "og:title", content: "Orbit Settings" },
      { property: "og:description", content: "Configure connected channels and automated reply logic for the Orbit workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});
