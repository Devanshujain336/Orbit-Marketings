import { lazy, Suspense, useState, useEffect } from "react";
import { ClientOnly, Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CalendarCheck2,
  Check,
  Clapperboard,
  Compass,
  MessageCircleReply,
  ScanSearch,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrbitLogoMark } from "@/components/orbit/orbit-logo";

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
  {
    icon: ScanSearch,
    number: "01",
    title: "We learn your brand",
    text: "Share your website once. Orbit understands your offer, audience, voice, and visual style.",
    badge: "AI Scraper",
    link: "/scrape",
    linkText: "Analyze URL →",
  },
  {
    icon: Clapperboard,
    number: "02",
    title: "We make the content",
    text: "Choose AI videos, a real VasuDev MarketX shoot, or both. Every idea stays true to your brand.",
    badge: "Studio AI",
    link: "/content",
    linkText: "View Pipeline →",
  },
  {
    icon: CalendarCheck2,
    number: "03",
    title: "We find your audience",
    text: "Orbit schedules and boosts every video across Instagram and Facebook to create demand.",
    badge: "Always On",
    link: "/distribution",
    linkText: "Channels →",
  },
  {
    icon: MessageCircleReply,
    number: "04",
    title: "You talk to real buyers",
    text: "Every DM gets an instant reply. Orbit qualifies each lead before it reaches your calendar.",
    badge: "Auto Qualify",
    link: "/leads",
    linkText: "View Leads →",
  },
] as const;

const outcomes = [
  "Every message answered in seconds",
  "High-intent leads surfaced first",
  "One clear view from content to customer",
] as const;

const HERO_OUTCOMES = [
  "qualified demand.",
  "high-value leads.",
  "predictable revenue.",
];

function TextRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1 >= HERO_OUTCOMES.length ? 0 : prev + 1));
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="inline-grid justify-items-start">
      {HERO_OUTCOMES.map((text, i) => {
        const isActive = i === index;
        const isLeaving = i === (index - 1 + HERO_OUTCOMES.length) % HERO_OUTCOMES.length;

        return (
          <span
            key={text}
            className={`col-start-1 row-start-1 whitespace-nowrap text-primary transition-all duration-700 ease-in-out ${
              isActive
                ? "translate-y-0 opacity-100 blur-0"
                : isLeaving
                  ? "pointer-events-none -translate-y-3 opacity-0 blur-[2px]"
                  : "pointer-events-none translate-y-3 opacity-0 blur-[2px]"
            }`}
            aria-hidden={!isActive}
          >
            {text}
          </span>
        );
      })}
    </span>
  );
}

function OrbitVisual() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[660px]"
      aria-label="Orbit's always-on marketing workflow"
    >
      <ClientOnly fallback={<div className="absolute inset-[12%] rounded-full border border-primary/30" />}>
        <Suspense fallback={<div className="absolute inset-[12%] rounded-full border border-primary/30" />}>
          <OrbitThree />
        </Suspense>
      </ClientOnly>
    </div>
  );
}

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section with Navigation */}
      <section className="relative min-h-[92vh] overflow-hidden border-b border-border bg-background">
        <nav className="relative z-30 mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:px-10">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Orbit home">
            <OrbitLogoMark size={30} className="text-primary" />
            <span className="font-display text-lg font-bold tracking-tight">ORBIT</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <Button asChild variant="ghost" className="text-sm">
              <Link to="/scrape">
                <ScanSearch className="mr-1.5 size-4 text-primary" />
                Analyze Brand
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm">
              <Link to="/content">Content</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm">
              <Link to="/distribution">Distribution</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm">
              <Link to="/leads">Leads</Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/scrape">AI Scraper</Link>
            </Button>
            <Button asChild className="h-11 px-5">
              <Link to="/dashboard">
                Open workspace <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col items-center px-5 pb-12 pt-10 text-center md:px-10 md:pt-14">
          <div className="max-w-4xl">
            <p className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" />
              Your entire marketing team, in one orbit
            </p>
            <h1 className="text-5xl font-semibold leading-[1.04] tracking-tight md:text-7xl lg:text-[5.5rem]">
              Orbit turns attention into <br className="hidden sm:inline" />
              <span className="inline-block"><TextRotator /></span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              We extract your brand DNA, create high-converting short videos, run targeted social ads, and qualify every buyer DM in real time.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7 shadow-lg">
                <Link to="/dashboard">
                  Open your workspace <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7">
                <Link to="/scrape">
                  <ScanSearch className="mr-2 size-4 text-primary" />
                  Analyze your website
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 w-full">
            <OrbitVisual />
          </div>
        </div>
      </section>

      {/* 4 Steps Section */}
      <section className="border-b border-border bg-secondary/50">
        <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-10 md:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Zap className="size-3.5" />
                How Orbit Works
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
                Four steps. One connected engine.
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
                No agency handoffs. No chasing freelancers. No inbox full of leads that were never going to buy.
              </p>
              <div className="mt-8">
                <Button asChild variant="outline">
                  <Link to="/onboarding">Start Onboarding Flow →</Link>
                </Button>
              </div>
            </div>

            <div className="grid border-l border-t border-border sm:grid-cols-2">
              {steps.map((step) => (
                <article key={step.number} className="group relative border-b border-r border-border bg-card p-6 md:p-8 transition-colors hover:bg-accent/40">
                  <div className="flex items-center justify-between">
                    <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <step.icon className="size-5" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{step.number}</span>
                  </div>
                  <div className="mt-2 inline-block rounded border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {step.badge}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                  <div className="mt-5 pt-3 border-t border-border/50">
                    <Link
                      to={step.link}
                      className="text-xs font-bold uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {step.linkText}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lead Qualification Demo */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-20 md:px-10 md:py-28 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[430px] overflow-hidden rounded-xl border border-border bg-secondary p-5 shadow-lg md:p-8">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">New inbound lead</p>
                <p className="mt-1 font-semibold">Instagram DM · just now</p>
              </div>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                HIGH INTENT 🔥
              </span>
            </div>
            <div className="mt-8 max-w-[85%] rounded-lg border border-border bg-card p-4 text-sm leading-relaxed shadow-sm">
              “We need 20 high-converting product videos next month. Can you handle the scriptwriting, video ads, and inbound lead qualification?”
            </div>
            <div className="ml-auto mt-4 max-w-[85%] rounded-lg bg-primary p-4 text-sm leading-relaxed text-primary-foreground shadow-md">
              “Absolutely! What target launch date and monthly ad budget are you planning for this campaign?”
            </div>
            <div className="mt-8 grid grid-cols-3 gap-2 border-t border-border pt-6 text-center">
              <div>
                <p className="text-2xl font-semibold num text-primary">04s</p>
                <p className="text-xs text-muted-foreground">reply time</p>
              </div>
              <div>
                <p className="text-2xl font-semibold num">91</p>
                <p className="text-xs text-muted-foreground">intent score</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-emerald-600">High</p>
                <p className="text-xs text-muted-foreground">priority</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">More customers. Less inbox.</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
              Be first to reply without living on your phone.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Orbit responds while interest is high, asks the questions that reveal buyer intent, and hands over qualified meetings straight to your calendar.
            </p>
            <ul className="mt-8 space-y-4">
              {outcomes.map((outcome) => (
                <li key={outcome} className="flex items-center gap-3 font-semibold text-foreground">
                  <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-4" />
                  </span>
                  {outcome}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-12 px-7">
                <Link to="/leads">
                  See qualified leads <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7">
                <Link to="/scrape">
                  Extract Brand DNA
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="bg-foreground text-background">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 px-5 py-16 md:flex-row md:items-center md:px-10">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-4" /> Ready when you are
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold md:text-4xl text-background">
              Stop managing marketing chaos. Start talking to qualified buyers.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="outline" className="h-12 shrink-0 border-background/20 bg-transparent text-background hover:bg-background/10">
              <Link to="/scrape">Analyze Website</Link>
            </Button>
            <Button asChild size="lg" className="h-12 shrink-0 px-7 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/onboarding">
                Build your Orbit <Target className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}