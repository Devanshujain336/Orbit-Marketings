import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ScanSearch, Sparkles } from "lucide-react";
import { OrbitLogoMark } from "@/components/orbit/orbit-logo";
import { Button } from "@/components/ui/button";

const HERO_OUTCOMES = [
  "qualified demand.",
  "high-value leads.",
  "predictable revenue.",
];

export function HeroTextRotator() {
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

export function Hero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden border-b border-border bg-background">
      <nav className="relative z-30 mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:px-10">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Orbit home">
          <OrbitLogoMark size={30} className="text-primary" />
          <span className="font-display text-lg font-bold">ORBIT</span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          <Button asChild variant="ghost">
            <Link to="/scrape">AI Scraper</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/content">Content</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/distribution">Distribution</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/leads">Leads</Link>
          </Button>
        </div>
        <Button asChild className="h-11 px-5">
          <Link to="/dashboard">
            Open workspace <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </nav>
      <div className="mx-auto flex max-w-[1440px] flex-col items-center px-5 pb-12 pt-10 text-center md:px-10 md:pt-14">
        <p className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <Sparkles className="size-3.5" />
          Your entire marketing team, in one orbit
        </p>
        <h1 className="text-5xl font-semibold leading-[1.04] tracking-tight md:text-7xl lg:text-[5.5rem]">
          Orbit turns attention into <br />
          <span className="inline-block"><HeroTextRotator /></span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          We make your content, run the ads, answer every message instantly, and send you only the people ready to buy.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 px-7 shadow-md">
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
    </section>
  );
}
