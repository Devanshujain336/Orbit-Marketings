import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Check,
  Clapperboard,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Palette,
  ScanSearch,
  Sparkles,
  Target,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { saveBrandProfile, createContentItem } from "@/lib/orbit";
import { OrbitLogoMark } from "@/components/orbit/orbit-logo";

export const Route = createFileRoute("/scrape")({
  head: () => ({
    meta: [
      { title: "Orbit Brand Scan — Turn Any Website Into Video Hooks" },
      {
        name: "description",
        content:
          "Paste a website and Orbit reads the brand voice, ideal buyer, colors, video hooks and DM qualifying questions in seconds.",
      },
      { property: "og:title", content: "Orbit Brand Scan" },
      {
        property: "og:description",
        content: "Read any brand's positioning, buyer and video angles in one scan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScrapePage,
});

type BrandIntel = {
  site: {
    url: string;
    domain: string;
    title: string;
    siteName: string;
    logo: string | null;
    ogImage: string | null;
    themeColor: string | null;
    wordCount: number;
    socials: string[];
    keyPages: string[];
    ctas: string[];
  };
  summary: string;
  brandIdentity: string;
  targetAudience: string;
  painPoints: string[];
  palette: { name: string; hex: string }[];
  vibeKeywords: string[];
  videoAngles: { hook: string; pattern: string; why: string }[];
  qualifyingQuestions: string[];
  autoReply: string;
  source: "ai" | "heuristic";
};

const SAMPLE_URLS = [
  { label: "Linear", url: "https://linear.app" },
  { label: "Supabase", url: "https://supabase.com" },
  { label: "Cal.com", url: "https://cal.com" },
  { label: "Resend", url: "https://resend.com" },
];

const STEPS = [
  "Opening the page and reading the headline, buttons and menu…",
  "Working out the voice, the buyer and the colours…",
  "Writing three video hooks and the DM questions…",
];

function ScrapePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<BrandIntel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (targetUrl?: string) => {
    const urlToScrape = (targetUrl ?? url).trim();
    if (!urlToScrape) return;
    if (targetUrl) setUrl(targetUrl);

    setLoading(true);
    setResult(null);
    setError(null);
    setLoadingStep(1);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1100);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToScrape }),
      });
      const data = (await res.json()) as BrandIntel & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "We couldn't analyze that website.");

      setResult(data);
      toast.success(
        data.source === "ai" ? "Brand scan complete." : "Scan complete — AI was busy, so we used a fast read.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong while reading that site.";
      setError(message);
      toast.error("Scan failed");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleApplyToWorkspace = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      await saveBrandProfile({
        name: result.site.siteName || result.site.domain,
        website: result.site.url,
        industry: result.brandIdentity,
        audience: result.targetAudience,
        offer: result.summary,
        tone: result.vibeKeywords.join(", "),
        positioning: result.summary,
        summary: result.summary,
        brandIdentity: result.brandIdentity,
        vibeKeywords: result.vibeKeywords,
        videoAngles: result.videoAngles.map((angle) => angle.hook),
        qualifyingQuestions: result.qualifyingQuestions,
      });
      toast.success("Brand loaded into your workspace.");
      navigate({ to: "/onboarding" });
    } catch {
      toast.error("Couldn't save the brand — opening onboarding anyway.");
      navigate({ to: "/onboarding" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProduceAngle = async (angle: BrandIntel["videoAngles"][number], index: number) => {
    try {
      await createContentItem({
        title: `${result?.site.siteName ?? "Brand"} hook #${index + 1}`,
        path: "ai",
        pattern: angle.pattern,
        notes: `${angle.hook}\n\nWhy it works: ${angle.why}`,
      });
      toast.success("Added to your content pipeline.");
      navigate({ to: "/content" });
    } catch {
      toast.error("Couldn't add that video — opening the pipeline.");
      navigate({ to: "/content" });
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    void navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-10">
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
            <OrbitLogoMark size={26} className="text-primary" />
            <span>ORBIT</span>
            <span className="hidden rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary sm:inline">
              BRAND SCAN
            </span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/content">Content</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/leads">Leads</Link>
            </Button>
            <Button asChild size="sm" className="h-9">
              <Link to="/dashboard">Workspace →</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            <span>Step 01 — Read the brand</span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Paste a website. Get a plan.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Orbit reads the page like a strategist would — what you sell, who buys it, how you sound — then hands you
            three video hooks and the questions that separate real buyers from browsers.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                required
                placeholder="yourstartup.com"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={loading}
                className="h-13 w-full rounded-lg border border-border bg-card pl-11 pr-4 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button type="submit" disabled={loading || !url} size="lg" className="h-13 px-8 text-base font-semibold shadow-md">
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Reading…
                </>
              ) : (
                <>
                  <ScanSearch className="mr-2 size-5" /> Scan website
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Try:</span>
            {SAMPLE_URLS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                disabled={loading}
                onClick={() => void handleSubmit(sample.url)}
                className="rounded border border-border bg-secondary/60 px-2.5 py-1 text-foreground transition-colors hover:border-primary hover:bg-accent/60 disabled:opacity-50"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="mx-auto mt-12 max-w-xl rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="size-6 animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Scanning the site…</p>
                <p className="text-xs text-muted-foreground">{STEPS[Math.max(0, loadingStep - 1)]}</p>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    loadingStep >= step ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center text-sm text-destructive">
            <p className="font-semibold">We couldn't finish that scan</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        )}

        {result && !loading && (
          <div className="mx-auto mt-12 max-w-5xl space-y-6">
            {/* Identity card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-md md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
                <div className="flex items-center gap-3">
                  {result.site.logo ? (
                    <img
                      src={result.site.logo}
                      alt={`${result.site.siteName} logo`}
                      className="size-10 rounded-lg border border-border bg-background object-contain p-1.5"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                      <Check className="size-5" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold">{result.site.siteName || result.site.domain}</h2>
                    <a
                      href={result.site.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      {result.site.domain} <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-border px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
                    {result.source === "ai" ? "AI analysis" : "Fast read"} · {result.site.wordCount} words
                  </span>
                  <Button size="sm" onClick={() => void handleApplyToWorkspace()} disabled={isSaving} className="shadow-sm">
                    {isSaving ? "Saving…" : (
                      <>
                        Use this brand <ArrowRight className="ml-1.5 size-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What they sell</h3>
                  <p className="mt-2 text-sm leading-relaxed">{result.summary}</p>

                  <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">How they sound</h3>
                  <p className="mt-2 text-sm leading-relaxed">{result.brandIdentity}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {result.vibeKeywords.map((word) => (
                      <span key={word} className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Target className="size-3.5" /> Who buys
                    </h3>
                    <p className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-primary">
                      {result.targetAudience}
                    </p>
                  </div>
                  <div>
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Palette className="size-3.5" /> Colours on the site
                    </h3>
                    <div className="mt-2 flex gap-2">
                      {result.palette.map((color) => (
                        <div key={`${color.name}-${color.hex}`} className="flex-1 text-center">
                          <div
                            className="h-10 w-full rounded-md border border-border"
                            style={{ backgroundColor: color.hex }}
                            title={`${color.name} ${color.hex}`}
                          />
                          <p className="mt-1 font-mono text-[9px] uppercase text-muted-foreground">{color.hex}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {(result.painPoints.length > 0 || result.site.ctas.length > 0) && (
                <div className="mt-6 grid gap-6 border-t border-border pt-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Problems they solve
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {result.painPoints.map((point) => (
                        <li key={point} className="flex gap-2 text-sm">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      What the site asks visitors to do
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {result.site.ctas.length > 0 ? (
                        result.site.ctas.map((cta) => (
                          <span key={cta} className="rounded border border-border bg-secondary/50 px-2 py-0.5 text-xs">
                            {cta}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No clear buttons found on the page.</span>
                      )}
                    </div>
                    {result.site.socials.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Social channels found
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {result.site.socials.map((social) => (
                            <a
                              key={social}
                              href={social}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                            >
                              {new URL(social).hostname.replace(/^www\./, "")}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Video hooks */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-md md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <Clapperboard className="size-5 text-primary" />
                  <h2 className="text-lg font-semibold">Video hooks ready to shoot</h2>
                </div>
                <span className="rounded bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                  {result.videoAngles.length} CONCEPTS
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {result.videoAngles.map((angle, index) => (
                  <div
                    key={`${angle.hook}-${index}`}
                    className="flex flex-col justify-between rounded-lg border border-border bg-secondary/40 p-4 transition-all hover:border-primary/50 hover:bg-card"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono font-semibold">#{index + 1} {angle.pattern.replace(/_/g, " ")}</span>
                        <Video className="size-3.5 text-primary" />
                      </div>
                      <p className="mt-3 text-sm font-medium leading-relaxed">{angle.hook}</p>
                      {angle.why && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{angle.why}</p>}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(angle.hook, index)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="size-3.5" /> <span className="font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" /> <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleProduceAngle(angle, index)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Produce →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DM script */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-md md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <Bot className="size-5 text-primary" />
                  <h2 className="text-lg font-semibold">The reply that qualifies every DM</h2>
                </div>
                <span className="text-xs font-bold text-primary">Always on</span>
              </div>

              <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">First automatic reply</p>
                <p className="mt-2 text-sm leading-relaxed">{result.autoReply}</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.autoReply, 99)}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {copiedIndex === 99 ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} Copy reply
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {result.qualifyingQuestions.map((question, index) => (
                  <div
                    key={question}
                    className="flex items-start gap-3 rounded-lg border border-border bg-secondary/20 p-3.5 text-sm"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span>{question}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Orbit sends these in Instagram and WhatsApp DMs, then sorts each lead into high, medium or low value.
                </p>
                <Button asChild size="sm">
                  <Link to="/leads">See the lead inbox →</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
