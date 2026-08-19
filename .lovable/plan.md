# Orbit — Marketing Site

A single-page, high-polish marketing site for Orbit: the end-to-end marketing engine that takes startups from brand analysis to qualified leads.

## Visual direction

Dark, high-contrast "orbital" aesthetic — deep space navy/near-black base, one electric accent (signal cyan/violet), soft glow rings and subtle orbit-path lines as structural motifs. Large tight-tracked display type, generous whitespace, restrained motion (fade-and-rise on scroll, one slow rotating orbit graphic in the hero). No purple-on-white gradient slop, no stock-photo filler, no "trusted by" logo wall.

## Page sections (in order)

1. **Nav** — Orbit wordmark, 3 links (How it works, Content, Leads), one CTA "Book a call".
2. **Hero** — headline on the core promise (instant response to every lead, founders' time only on high-value ones), one-line subhead, single primary CTA, animated orbit visual.
3. **Problem strip** — the "five agencies" pain: 3 short stat/pain cards (juggling agencies, DMs left unanswered, hours of manual triage).
4. **How it works** — the 4 stages as a connected orbit/timeline: Onboarding & Analysis → Content Creation → Distribution → Lead Qualification. Each with a short description and a stage numeral.
5. **Content creation split** — two-path section: Offline shoot (with VasuDev MarketX for filming + editing) vs AI-generated (viral pattern detection adapted to brand vibe). Side-by-side comparison panels.
6. **Distribution** — Instagram/Facebook scheduling + ad boosting feeding inbound WhatsApp/IG DMs; simple flow diagram.
7. **Lead qualification** — visual mock of a DM inbox sorted into High / Medium / Low value tiers, showing the auto-reply and the tiering.
8. **Value prop band** — the two core outcomes stated large: instant response = higher conversion; time only on high-value leads = hours saved.
9. **FAQ** — 5 concise questions (setup time, do I need to be on camera, who owns the content, platforms supported, pricing model placeholder).
10. **Closing CTA + minimal footer.**

Content is static/marketing copy — no backend, database, or auth in this scope.

## Technical notes

- Rewrite `src/routes/index.tsx` as the Orbit landing page; break sections into components under `src/components/orbit/`.
- Add design tokens (space base, accent, glow shadows, orbit gradient) to `src/styles.css` under `:root` + `@theme inline`; dark-first values. No hardcoded color utilities in components.
- Load a display + body font pair via `<link>` in `src/routes/__root.tsx`, referenced through `--font-*` theme tokens.
- Scroll reveals and the orbit rotation via Motion for React (`motion`), added as a dependency; respect `prefers-reduced-motion`.
- Generate 2–3 supporting visuals (orbit hero graphic, abstract content/reel texture) into `src/assets/`.
- Route-level `head()` on `/` with Orbit-specific title, description, og:title/og:description; update `__root` defaults away from the Lovable placeholder. Single H1, semantic sections, alt text.

## Open items (defaults if unanswered)

- Pricing: no numbers shown; CTA is "Book a call".
- VasuDev MarketX presented as a named production partner in the offline path.
