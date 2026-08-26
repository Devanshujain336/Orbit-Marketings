import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  Flame,
  Gauge,
  Inbox,
  Megaphone,
  Radio,
  Rocket,
  Sparkles,
  Target,
  Timer,
  Zap,
  HomePreviewStats,
} from "@/components/orbit/workspace-pages";
import { Button } from "@/components/ui/button";
import { Chip, Panel, SpeedLine, StatTile, TierBadge } from "@/components/orbit/primitives";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orbit — Startup Marketing Engine" },
      {
        name: "description",
        content: "Orbit creates, distributes, boosts, replies to, and qualifies startup marketing leads in one fastlane workspace.",
      },
      { property: "og:title", content: "Orbit — Startup Marketing Engine" },
      {
        property: "og:description",
        content: "Content creation, Meta distribution, instant DM replies, and lead qualification for founders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const engine = [
  { icon: Rocket, title: "Onboard", text: "Website, startup info, audience, offer, tone, and visual direction." },
  { icon: Sparkles, title: "Create", text: "AI video concepts or offline production with VasuDev MarketX." },
  { icon: CalendarClock, title: "Distribute", text: "Schedule Instagram and Facebook posts with boost budgets." },
  { icon: Inbox, title: "Qualify", text: "Auto-reply to DMs and sort leads into high, medium, and low value." },
] as const;

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="grid-asphalt relative overflow-hidden border-b border-border">
        <div className="mx-auto flex min-h-[92vh] max-w-[1500px] flex-col px-5 py-5">
          <nav className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-sm bg-primary text-primary-foreground">
                <Radio className="size-4" />
              </span>
              <span className="font-display text-xl font-bold">ORBIT</span>
            </Link>
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="sm"><Link to="/content">Content</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link to="/distribution">Distribution</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link to="/leads">Leads</Link></Button>
            </div>
            <Button asChild><Link to="/dashboard">Open workspace <ArrowRight className="size-4" /></Link></Button>
          </nav>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-4xl">
              <div className="mb-6 flex flex-wrap gap-2">
                <Chip>Content engine</Chip>
                <Chip>Meta distribution</Chip>
                <Chip>AI lead triage</Chip>
              </div>
              <h1 className="text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl xl:text-8xl">
                One fastlane for startup attention to qualified demand.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Orbit replaces the agency juggling act: it analyzes your brand, produces content, boosts it on Instagram and Facebook, replies instantly to inbound DMs, and sends founders only the leads worth their time.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link to="/dashboard"><Gauge className="size-4" /> Launch pit wall</Link></Button>
                <Button asChild size="lg" variant="outline"><Link to="/onboarding">Start onboarding</Link></Button>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-signal/10 blur-3xl" />
              <OrbitSystem />
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Everything a startup needs to get seen and sell — running in one loop, around the clock.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 py-16 text-center">
        <p className="label-xs">In plain English</p>
        <h2 className="mt-3 text-4xl font-semibold md:text-5xl">You post nothing. You chase nobody. You only talk to real buyers.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Today a founder hires a video person, an editor, an ads person, and still answers DMs at midnight. Orbit does all four
          jobs in one place: it makes the videos, runs the ads, answers every message instantly, and tells you which people are
          actually worth your time.
        </p>
        <div className="mt-10 grid gap-4 text-left md:grid-cols-2">
          {plainSteps.map((step, index) => (
            <Panel key={step.title} className="relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px speed-line opacity-60" />
              <div className="flex items-start gap-4">
                <span className="num grid size-9 shrink-0 place-items-center rounded-full border border-signal/40 text-sm text-signal">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.you}</p>
                  <p className="mt-2 text-sm">
                    <span className="label-xs mr-2">Orbit does</span>
                    {step.orbit}
                  </p>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 pb-16">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="label-xs">Full software, not a brochure</p>
            <h2 className="mt-3 text-4xl font-semibold">The operating system behind the marketing loop.</h2>
            <p className="mt-4 text-muted-foreground">Each surface is already in the workspace: onboarding, pipeline, scheduling, lead inbox and settings. The homepage describes Orbit; the cockpit runs it.</p>
            <div className="panel sweep mt-6 overflow-hidden">
              <div className="border-b border-border p-4">
                <p className="label-xs">Orbit lead cockpit</p>
                <h3 className="mt-1 text-2xl font-semibold">Instant replies. Founder time protected.</h3>
              </div>
              <div className="space-y-4 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatTile label="Reply lag" value="00:04" hint="seconds" tone="signal" />
                  <StatTile label="AI score" value="91" unit="/100" hint="buying intent" tone="heat" />
                  <StatTile label="Founder handoff" value="High" hint="priority" tone="cool" />
                </div>
                <div className="rounded-md border border-border bg-secondary/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="label-xs">WhatsApp inbound</p>
                      <p className="mt-1 font-semibold">Need 20 videos this month. Can you handle scripting, shoot, ads and qualify replies?</p>
                    </div>
                    <TierBadge tier="high" score={91} />
                  </div>
                  <SpeedLine className="my-4" />
                  <p className="text-sm text-muted-foreground">Auto-reply asks budget, launch window, and volume before routing the conversation to the founder queue.</p>
                </div>
                <HomePreviewStats />
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {engine.map((item, index) => (
              <Panel key={item.title} className="relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px speed-line opacity-60" />
                <item.icon className="size-5 text-signal" />
                <p className="label-xs mt-4">Stage {index + 1}</p>
                <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>


      <section className="border-y border-border bg-asphalt">
        <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-16 lg:grid-cols-3">
          <Panel title="Offline shoot">
            <Flame className="size-5 text-heat" />
            <h3 className="mt-4 text-2xl font-semibold">VasuDev MarketX production lane</h3>
            <p className="mt-3 text-sm text-muted-foreground">Capture brief, dates, location, and track production from requested to delivered.</p>
            <Button asChild className="mt-6" variant="secondary"><Link to="/content">Request shoot</Link></Button>
          </Panel>
          <Panel title="AI-generated">
            <Bot className="size-5 text-cool" />
            <h3 className="mt-4 text-2xl font-semibold">Pattern-matched viral drafts</h3>
            <p className="mt-3 text-sm text-muted-foreground">Pick a proven hook pattern, adapt it to brand vibe, and send a ready draft to distribution.</p>
            <Button asChild className="mt-6" variant="secondary"><Link to="/content">Generate content</Link></Button>
          </Panel>
          <Panel title="Lead triage">
            <Zap className="size-5 text-signal" />
            <h3 className="mt-4 text-2xl font-semibold">Only high-value leads reach founders</h3>
            <p className="mt-3 text-sm text-muted-foreground">Every customer gets an instant reply while Orbit qualifies, scores, and sorts the pipeline.</p>
            <Button asChild className="mt-6" variant="secondary"><Link to="/leads">Open inbox</Link></Button>
          </Panel>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="panel overflow-hidden">
            <div className="border-b border-border p-4">
              <p className="label-xs">Founder outcome</p>
              <h2 className="mt-1 text-3xl font-semibold">Stop paying five teams to lose context between handoffs.</h2>
            </div>
            <div className="grid gap-0 sm:grid-cols-2">
              {["Agency coordination", "Delayed DM replies", "Manual lead sorting", "Unclear ad follow-through"].map((item) => (
                <div key={item} className="border-b border-border p-5 odd:border-r">
                  <CheckCircle2 className="size-5 text-signal" />
                  <p className="mt-3 font-semibold">{item}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Collapsed into one Orbit workflow.</p>
                </div>
              ))}
            </div>
          </div>
          <Panel title="Workspace access" className="flex flex-col justify-between">
            <div>
              <Target className="size-6 text-signal" />
              <h2 className="mt-5 text-4xl font-semibold">The full cockpit is live.</h2>
              <p className="mt-4 text-muted-foreground">Open the demo workspace to see dashboard metrics, brand onboarding, content creation, distribution scheduling, DM qualification, and channel settings.</p>
            </div>
            <Button asChild size="lg" className="mt-8 w-fit"><Link to="/dashboard">Enter Orbit <ArrowRight className="size-4" /></Link></Button>
          </Panel>
        </div>
      </section>
    </main>
  );
}
