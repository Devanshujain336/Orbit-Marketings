import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/components/orbit/workspace-pages";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Orbit Onboarding — Brand Analysis" },
      { name: "description", content: "Add startup context and generate the Orbit brand profile used across content and lead replies." },
      { property: "og:title", content: "Orbit Onboarding — Brand Analysis" },
      { property: "og:description", content: "Analyze brand voice, audience, offer, and positioning inside Orbit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});
