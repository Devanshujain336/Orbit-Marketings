# Orbit — Polish Pass

## 1. Tapping the Orbit name goes home (open item)

On phones and tablets the Orbit mark and "ORBIT" text in the top bar are plain text, so tapping them does nothing. Make that pair a link to the main page, matching the desktop sidebar behaviour. Keep the same size and spacing so nothing shifts.

## 2. Small polish along the way

- Give the tappable name a clear pressed/hover state so it reads as a link.
- Keep the desktop sidebar link as-is (already working).

## Technical notes

- `src/components/orbit/app-shell.tsx`: wrap the mobile-only logo/name block (currently a bare `div` around `OrbitLogoMark` + the "Orbit" span, inside the header's `min-w-0` column) in `<Link to="/">`, keeping `lg:hidden` and existing classes; add a hover/active opacity transition.
- Verify with Playwright at 390px and at desktop width that both logo targets navigate to `/`, then confirm the build log is clean.
