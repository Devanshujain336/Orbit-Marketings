import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Check,
  Clapperboard,
  Compass,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  HelpCircle,
  Layers,
  Loader2,
  Radio,
  ScanSearch,
  Sparkles,
  Target,
  Video,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { saveBrandProfile, createContentItem } from "@/lib/orbit";
import { OrbitLogoMark } from "@/components/orbit/orbit-logo";

export const Route = createFileRoute("/scrape")({
  head: () => ({
    meta: [
      { title: "Orbit AI Brand Scraper — Extract Brand DNA & Video Hooks" },
      {
        name: "description",
        content: "Scan any website to extract brand voice, ideal audience, video ad hooks, and lead qualification triggers.",
      },
    ],
  }),
  component: ScrapePage,
});

interface ScrapeResult {
  summary: string;
  brandIdentity: string;
  targetAudience: string;
  videoAngles: string[];
  qualifyingQuestions: string[];
}

const SAMPLE_URLS = [
  { label: "Linear", url: "https://linear.app" },
  { label: "Supabase", url: "https://supabase.com" },
  { label: "Cal.com", url: "https://cal.com" },
  { label: "Resend", url: "https://resend.com" },
];

function ScrapePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (targetUrl?: string) => {
    const urlToScrape = targetUrl || url;
    if (!urlToScrape) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setLoadingStep(1);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 900);

    try {
      const formattedUrl = urlToScrape.startsWith("http") ? urlToScrape : `https://${urlToScrape}`;
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formattedUrl }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze URL");
      }

      const data: ScrapeResult = await res.json();
      setResult(data);
      toast.success("Brand DNA extracted successfully!");

      // Auto-sync brand analysis to the workspace
      try {
        let brandName = "Scraped Brand";
        try {
          const parsedUrl = new URL(formattedUrl);
          const hostname = parsedUrl.hostname.replace(/^www\./, "");
          const base = hostname.split(".")[0];
          if (base) brandName = base.charAt(0).toUpperCase() + base.slice(1);
        } catch {}

        await saveBrandProfile({
          name: brandName,
          website: formattedUrl,
          industry: data.brandIdentity || "AI & Software",
          audience: data.targetAudience || "High-growth buyers",
          offer: data.summary || "",
          tone: data.brandIdentity || "Direct, high velocity",
        });
      } catch (saveErr) {
        console.error("Auto-syncing brand profile failed:", saveErr);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while analyzing the URL.");
      toast.error("Failed to analyze brand website.");
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
      const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
      let brandName = "Scraped Brand";
      try {
        const parsedUrl = new URL(formattedUrl);
        const hostname = parsedUrl.hostname.replace(/^www\./, "");
        const base = hostname.split(".")[0];
        if (base) brandName = base.charAt(0).toUpperCase() + base.slice(1);
      } catch {}

      await saveBrandProfile({
        name: brandName,
        website: formattedUrl,
        industry: result.brandIdentity || "AI & Software",
        audience: result.targetAudience || "High-growth buyers",
        offer: result.summary || "",
        tone: result.brandIdentity || "Direct, high velocity",
      });
      toast.success("Brand DNA loaded into Onboarding!");
      navigate({ to: "/onboarding" });
    } catch (err) {
      navigate({ to: "/onboarding" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProduceAngle = async (angle: string, index: number) => {
    try {
      await createContentItem({
        title: `AI Hook #${index + 1}`,
        path: "ai",
        notes: angle,
      });
      toast.success("Video concept added to Content Pipeline!");
      navigate({ to: "/content" });
    } catch (err) {
      navigate({ to: "/content" });
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-10">
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
              <OrbitLogoMark size={26} className="text-primary" />
              <span>ORBIT</span>
            <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
              AI ENGINE
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/content">Content Pipeline</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/leads">Leads</Link>
            </Button>
            <Button asChild size="sm" className="h-9">
              <Link to="/dashboard">Workspace →</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            <span>Step 01 — Instant Brand Intelligence</span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Analyze any brand in seconds.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            Orbit reads the website, extracts core value props, detects buyer personas, and generates high-converting video concepts ready for distribution.
          </p>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="url"
                required
                placeholder="https://yourstartup.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="h-13 w-full rounded-lg border border-border bg-card pl-11 pr-4 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !url}
              size="lg"
              className="h-13 px-8 text-base font-semibold shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <ScanSearch className="mr-2 size-5" />
                  Analyze Website
                </>
              )}
            </Button>
          </form>

          {/* Sample Prompts */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Try sample:</span>
            {SAMPLE_URLS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setUrl(sample.url);
                  handleSubmit(sample.url);
                }}
                className="rounded border border-border bg-secondary/60 px-2.5 py-1 text-foreground transition-colors hover:border-primary hover:bg-accent/60"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Visualizer */}
        {loading && (
          <div className="mx-auto mt-12 max-w-xl rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="size-6 animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Orbit AI Brand Extractor in progress…</p>
                <p className="text-xs text-muted-foreground">
                  {loadingStep === 1 && "Fetching HTML DOM and parsing structural headings..."}
                  {loadingStep === 2 && "Synthesizing tone, positioning, and buyer ICP..."}
                  {loadingStep >= 3 && "Generating 3 viral video concepts & DM qualifier questions..."}
                </p>
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

        {/* Error Display */}
        {error && (
          <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center text-sm text-destructive">
            <p className="font-semibold">Unable to complete analysis</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        )}

        {/* Results Presentation */}
        {result && !loading && (
          <div className="mx-auto mt-12 max-w-4xl space-y-6">
            {/* Overview Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-md md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Check className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Brand Overview & Positioning</h2>
                    <p className="text-xs text-muted-foreground">Analyzed source: {url}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleApplyToWorkspace}
                  disabled={isSaving}
                  className="shadow-sm"
                >
                  {isSaving ? "Saving..." : (
                    <>
                      Launch With This Brand <ArrowRight className="ml-1.5 size-3.5" />
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Core Value Proposition
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{result.summary}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Brand Voice & ICP
                  </h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-medium text-foreground">{result.brandIdentity}</p>
                    <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
                      <span className="font-bold">Target Buyer:</span> {result.targetAudience}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Concepts Grid */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-md md:p-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <Clapperboard className="size-5 text-primary" />
                  <h2 className="text-lg font-semibold">Recommended Short-Form Video Hooks</h2>
                </div>
                <span className="rounded bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                  3 READY CONCEPTS
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {result.videoAngles.map((angle, i) => (
                  <div
                    key={i}
                    className="group relative flex flex-col justify-between rounded-lg border border-border bg-secondary/40 p-4 transition-all hover:border-primary/50 hover:bg-card"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono font-semibold">CONCEPT #{i + 1}</span>
                        <Video className="size-3.5 text-primary" />
                      </div>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">{angle}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(angle, i)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        {copiedIndex === i ? (
                          <>
                            <Check className="size-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProduceAngle(angle, i)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Produce →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inbound Qualification Matrix */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-md md:p-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <Bot className="size-5 text-primary" />
                  <h2 className="text-lg font-semibold">Autonomous DM Qualification Script</h2>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-primary">
                  <Flame className="size-3.5" /> Always On
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {result.qualifyingQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-border bg-secondary/20 p-3.5 text-sm"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {idx + 1}
                    </span>
                    <span className="text-foreground">{q}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Orbit deploys these questions directly into Instagram & Facebook DMs to qualify buyers in 4 seconds.
                </p>
                <Button asChild size="sm">
                  <Link to="/leads">View Live Inbound Leads →</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
