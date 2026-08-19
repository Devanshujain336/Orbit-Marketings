# Orbit — Full Product Build

Not a landing page: Orbit is built as a working multi-page app with real accounts, database, and a lead-triage inbox. A marketing home page fronts it, but the substance is the logged-in workspace.

Theme: "Fastlane" — motorsport telemetry energy. Near-black asphalt base, hot signal accent (electric lime/amber), speed-line dividers, monospaced numerals for metrics, tight uppercase labels, dense dashboard panels that read like a pit-wall display. Restrained motion: quick 120ms easing, sliding underlines, counters that tick up.

## Screens

**Public**
- `/` — Orbit pitch: hero, the 4-stage engine, offline vs AI content paths, lead-tiering preview, CTA into signup.
- `/auth` — sign in / sign up (email + password).

**Workspace (auth-gated)**
- `/dashboard` — pit-wall overview: leads by tier, response time, videos scheduled, campaign spend, recent activity feed.
- `/onboarding` — multi-step: website URL + startup info (industry, audience, tone, offer), then a brand analysis result card (palette, vibe keywords, positioning line) saved to the brand profile.
- `/content` — content pipeline board (Idea → In production → Ready → Scheduled → Published). Create a content item and pick its path:
  - Offline shoot → capture shoot brief, preferred dates, location; shows VasuDev MarketX as the production partner and a status trail (requested → scheduled → filmed → edited → delivered).
  - AI-generated → pick from viral pattern templates (hook type, format, pacing), Orbit drafts a script/hook/caption set adapted to the saved brand vibe using Lovable AI.
- `/distribution` — schedule published-ready videos to Instagram/Facebook with date/time, ad budget, and audience notes; calendar + list view of the schedule.
- `/leads` — the core surface: inbound leads from WhatsApp / Instagram DM with an auto-reply draft, an AI qualification score sorting them High / Medium / Low, and a thread view for replying. Filter by tier/channel/status, mark won/lost.
- `/settings` — business profile, connected channels (mock connection state), auto-reply tone and templates.

## Backend (Lovable Cloud)

Tables, all row-level-secured to the owning user: `businesses` (brand profile + analysis result), `content_items` (path, status, template, generated script/caption), `shoot_requests`, `schedules` (platform, publish time, ad budget, status), `leads` (channel, handle, intent summary, tier, score, status), `lead_messages` (thread, inbound/outbound), plus `profiles` and a separate `user_roles` table.

AI via Lovable AI Gateway in server functions:
- brand analysis from website URL + startup info → palette, vibe keywords, positioning
- AI content generation → hook, script beats, caption, hashtags in the brand's voice
- lead qualification → tier + score + reason + suggested first reply

Demo rows are seeded in the migration so every screen has content on first load.

## Technical notes

- Enable Lovable Cloud first; email/password auth with auto-confirm, `_authenticated` route group gating the workspace.
- Fastlane tokens (asphalt/carbon surfaces, signal accent, telemetry glow, speed-line gradient) defined in `src/styles.css` `:root` + `@theme inline`, dark-first, no hardcoded color utilities. Display font + mono numerals loaded via `<link>` in `__root.tsx`.
- Shared workspace shell (sidebar nav + top status bar) as a layout route with `<Outlet />`.
- Reads via route loaders + `ensureQueryData` / `useSuspenseQuery`; mutations via `createServerFn` in `*.functions.ts`, AI calls in server handlers only.
- Per-route `head()` metadata; workspace routes `noindex`.
- Motion for React for the light telemetry animations, respecting `prefers-reduced-motion`.

## Scope boundaries

- Instagram/Facebook/WhatsApp are modeled as in-app pipelines with a manual "simulate inbound lead" action rather than live Meta API integrations — the real Meta app review flow needs credentials and approval, which can be layered on later.
- No payments/billing in this pass.
