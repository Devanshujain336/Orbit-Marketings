import { lazy, Suspense } from "react";
import { ClientOnly, Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CalendarCheck2,
  Check,
  Clapperboard,
  MessageCircleReply,
  Radio,
  ScanSearch,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const OrbitThree = lazy(() =>
  import("@/components/orbit/orbit-three.client").then((module) => ({ default: module.OrbitThree })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orbit — Marketing Engine for Startups" },
      {
        name: "description",
        content: "Orbit creates content, runs social ads, replies instantly, and qualifies startup leads in one simple workflow.",
      },
      { property: "og:title", content: "Orbit — Marketing Engine for Startups" },
      {
        property: "og:description",
        content: "Content, distribution, instant replies, and lead qualification in one always-on marketing engine.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  { icon: ScanSearch, number: "01", title: "We learn your brand", text: "Share your website once. Orbit understands your offer, audience, voice, and visual style." },
  { icon: Clapperboard, number: "02", title: "We make the content", text: "Choose AI videos, a real VasuDev MarketX shoot, or both. Every idea stays true to your brand." },
  { icon: CalendarCheck2, number: "03", title: "We find your audience", text: "Orbit schedules and boosts every video across Instagram and Facebook to create demand." },
  { icon: MessageCircleReply, number: "04", title: "You talk to real buyers", text: "Every DM gets an instant reply. Orbit qualifies each lead before it reaches your calendar." },
] as const;

const outcomes = ["Every message answered in seconds", "High-intent leads surfaced first", "One clear view from content to customer"] as const;

function OrbitVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[660px]" aria-label="Orbit's always-on marketing workflow">
      <ClientOnly fallback={<div className="absolute inset-[12%] rounded-full border border-primary/30" />}>
        <Suspense fallback={<div className="absolute inset-[12%] rounded-full border border-primary/30" />}>
          <OrbitThree />
        </Suspense>
      </ClientOnly>
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex size-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-primary/20 bg-background/90 shadow-xl backdrop-blur-sm">
        <Radio className="size-5 text-primary" />
        <span className="mt-1 font-display text-sm font-bold">ORBIT</span>
        <span className="text-[10px] font-semibold text-muted-foreground">ALWAYS ON</span>
      </div>
      <div className="marketing-float absolute left-[4%] top-[25%] z-20 rounded-md border border-border bg-background/90 px-3 py-2 shadow-lg backdrop-blur-sm">
        <span className="text-xs font-bold">Onboard</span><span className="ml-2 text-xs text-muted-foreground">learn your brand</span>
      </div>
      <div className="marketing-float absolute right-[5%] top-[18%] z-20 rounded-md border border-border bg-background/90 px-3 py-2 shadow-lg backdrop-blur-sm [animation-delay:1s]">
        <span className="text-xs font-bold">Create</span><span className="ml-2 text-xs text-muted-foreground">make videos</span>
      </div>
      <div className="marketing-float absolute bottom-[19%] right-[2%] z-20 rounded-md border border-border bg-background/90 px-3 py-2 shadow-lg backdrop-blur-sm [animation-delay:2s]">
        <span className="text-xs font-bold">Distribute</span><span className="ml-2 text-xs text-muted-foreground">reach buyers</span>
      </div>
      <div className="marketing-float absolute bottom-[14%] left-[7%] z-20 rounded-md border border-border bg-background/90 px-3 py-2 shadow-lg backdrop-blur-sm [animation-delay:3s]">
        <span className="text-xs font-bold">Qualify</span><span className="ml-2 text-xs text-muted-foreground">protect your time</span>
      </div>
    </div>
  );
}

function Index() {
  return (
    <main className="marketing-theme min-h-screen bg-background text-foreground">
      <section className="relative min-h-[92vh] overflow-hidden border-b border-border">
        <nav className="relative z-30 mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:px-10">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Orbit home">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><Radio className="size-4" /></span>
            <span className="font-display text-lg font-bold">ORBIT</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <Button asChild variant="ghost"><Link to="/content">Content</Link></Button>
            <Button asChild variant="ghost"><Link to="/distribution">Distribution</Link></Button>
            <Button asChild variant="ghost"><Link to="/leads">Leads</Link></Button>
          </div>
          <Button asChild className="h-11 px-5"><Link to="/dashboard">Open workspace <ArrowRight /></Link></Button>
        </nav>

        <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col items-center px-5 pb-12 pt-10 text-center md:px-10 md:pt-14">
          <div className="max-w-4xl">
            <p className="mx-auto mb-6 w-fit rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold uppercase text-primary">Your entire marketing team, in one orbit</p>
            <h1 className="text-5xl font-semibold leading-[1.02] md:text-7xl lg:text-[5.5rem]">
              Orbit turns attention into <span className="text-primary">qualified demand.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              We make your content, run the ads, answer every message instantly, and send you only the people ready to buy.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7"><Link to="/dashboard">Open your workspace <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7"><Link to="/onboarding">Start with your website</Link></Button>
            </div>
          </div>
          <OrbitVisual />
        </div>
      </section>

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-10 md:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div>
              <p className="text-sm font-bold uppercase text-primary">How Orbit works</p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">Four steps. One connected system.</h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">No agency handoffs. No chasing freelancers. No inbox full of people who were never going to buy.</p>
            </div>
            <div className="grid border-l border-t border-border sm:grid-cols-2">
              {steps.map((step) => (
                <article key={step.number} className="border-b border-r border-border p-6 md:p-8">
                  <div className="flex items-center justify-between">
                    <step.icon className="size-5 text-primary" />
                    <span className="font-mono text-xs text-muted-foreground">{step.number}</span>
                  </div>
                  <h3 className="mt-8 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-20 md:px-10 md:py-28 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[430px] overflow-hidden rounded-md border border-border bg-secondary p-5 md:p-8">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div><p className="text-xs font-bold uppercase text-muted-foreground">New inbound lead</p><p className="mt-1 font-semibold">Instagram · just now</p></div>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">HIGH INTENT</span>
            </div>
            <div className="mt-8 max-w-[85%] rounded-md border border-border bg-background p-4 text-sm leading-relaxed">“We need 20 product videos next month. Can you handle the shoot, ads, and incoming enquiries?”</div>
            <div className="ml-auto mt-4 max-w-[85%] rounded-md bg-primary p-4 text-sm leading-relaxed text-primary-foreground">Absolutely. What launch date and monthly budget are you working with?</div>
            <div className="mt-8 grid grid-cols-3 gap-2 border-t border-border pt-6 text-center">
              <div><p className="text-2xl font-semibold">04s</p><p className="text-xs text-muted-foreground">reply time</p></div>
              <div><p className="text-2xl font-semibold">91</p><p className="text-xs text-muted-foreground">intent score</p></div>
              <div><p className="text-2xl font-semibold">High</p><p className="text-xs text-muted-foreground">priority</p></div>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase text-primary">More customers. Less inbox.</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">Be first to reply without living on your phone.</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">Orbit responds while interest is high, asks the questions that reveal buying intent, and hands over the conversation when it is worth your time.</p>
            <ul className="mt-8 space-y-4">
              {outcomes.map((outcome) => <li key={outcome} className="flex items-center gap-3 font-semibold"><span className="grid size-7 place-items-center rounded-full bg-accent"><Check className="size-4" /></span>{outcome}</li>)}
            </ul>
            <Button asChild size="lg" className="mt-10 h-12 px-7"><Link to="/leads">See qualified leads <ArrowRight /></Link></Button>
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 px-5 py-16 md:flex-row md:items-center md:px-10">
          <div><p className="flex items-center gap-2 text-sm font-bold text-accent"><Sparkles className="size-4" /> Ready when you are</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold md:text-4xl">Stop managing marketing. Start talking to buyers.</h2></div>
          <Button asChild size="lg" className="h-12 shrink-0 px-7"><Link to="/onboarding">Build your Orbit <Target /></Link></Button>
        </div>
      </section>
    </main>
  );
}