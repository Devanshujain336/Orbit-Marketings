import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  HeartHandshake,
  Loader2,
  MessageSquareQuote,
  Package,
  Palette,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
  X,
  Clapperboard,
  Tv,
  AlertCircle,
  Lightbulb,
  Video,
  Edit3,
  Clock,
  Film,
  Play,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { saveBrandProfile } from "@/lib/orbit";
import { OrbitLogoMark } from "@/components/orbit/orbit-logo";
import type { BrandBrain, ProductBrain } from "@/lib/gemini-brand-brain.server";
import type {
  AdvertisingConcept,
  StoryboardScene,
  CreativeDirection,
} from "@/lib/concept-generator.server";

export const Route = createFileRoute("/scrape")({
  head: () => ({
    meta: [
      { title: "Orbit — Website to Brand Understanding" },
      {
        name: "description",
        content:
          "Turn any website into a structured Brand Brain with Firecrawl crawling and Gemini intelligence.",
      },
      { property: "og:title", content: "Orbit Brand Understanding" },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),
  component: ScrapePage,
});

const SAMPLE_URLS = [
  { label: "Linear", url: "https://linear.app" },
  { label: "Supabase", url: "https://supabase.com" },
  { label: "Allbirds", url: "https://allbirds.com" },
  { label: "Gymshark", url: "https://gymshark.com" },
];

const LOADING_STEPS = [
  "Visiting website and discovering key pages...",
  "Extracting product information and visual assets...",
  "Structuring Brand Brain with Gemini intelligence...",
];

const INITIAL_VISIBLE_COUNT = 12;
const PAGE_SIZE = 12;

type CreativeDirectionOption = {
  id: string;
  title: string;
  badge: string;
  icon: typeof Clapperboard;
  description: string;
  image: string;
};

const CREATIVE_DIRECTIONS: CreativeDirectionOption[] = [
  {
    id: "brand-commercial",
    title: "Brand Commercial",
    badge: "Cinematic & Narrative",
    icon: Tv,
    description: "A cinematic, premium advertisement focused on brand identity, mood, and storytelling.",
    image: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=720&q=80",
  },
  {
    id: "product-showcase",
    title: "Product Showcase",
    badge: "Design & Features",
    icon: Sparkles,
    description: "An advertisement that highlights the actual product, its appearance, design, features, and supported benefits.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=720&q=80",
  },
  {
    id: "lifestyle-advertisement",
    title: "Lifestyle Advertisement",
    badge: "Real-world & Relatable",
    icon: Video,
    description: "An advertisement showing the product in a relatable real-world context.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=720&q=80",
  },
];

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 | 4 | 5 }) {
  const steps = [
    { number: 1, label: "Brand Understanding" },
    { number: 2, label: "Product Selection" },
    { number: 3, label: "Creative Theme" },
    { number: 4, label: "Creative Directions" },
    { number: 5, label: "Advertising Script" },
  ];

  return (
    <div className="mx-auto mb-8 flex max-w-3xl items-center justify-between px-2">
      {steps.map((s, idx) => {
        const isCurrent = currentStep === s.number;
        const isCompleted = currentStep > s.number;

        return (
          <div key={s.number} className="flex flex-1 items-center">
            <div className="flex items-center gap-2">
              <div
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/20 scale-105"
                    : isCompleted
                      ? "bg-primary/15 text-primary"
                      : "border border-border bg-card/60 text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="size-3.5 stroke-[2.5]" /> : s.number}
              </div>
              <span
                className={`text-[11px] font-semibold sm:text-xs tracking-tight ${
                  isCurrent
                    ? "text-foreground font-bold"
                    : isCompleted
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`mx-2 h-[2px] flex-1 sm:mx-3 transition-colors ${
                  currentStep > idx + 1 ? "bg-primary" : "bg-border/70"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EditableTagList({
  title,
  icon: Icon,
  tags,
  onAdd,
  onRemove,
  placeholder = "Add new...",
}: {
  title: string;
  icon?: typeof Target;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
}) {
  const [newTag, setNewTag] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (trimmed) {
      onAdd(trimmed);
      setNewTag("");
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {Icon && <Icon className="size-3.5 text-primary" />}
          {title}
        </h4>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            <Plus className="size-3" /> Add
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="group inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-secondary/80"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="text-muted-foreground transition-colors hover:text-destructive"
              title="Remove"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        {tags.length === 0 && !isAdding && (
          <span className="text-xs italic text-muted-foreground">None listed yet</span>
        )}

        {isAdding && (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newTag}
              autoFocus
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                } else if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewTag("");
                }
              }}
              placeholder={placeholder}
              className="h-7 rounded border border-primary/50 bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button type="button" size="sm" onClick={handleAdd} className="h-7 px-2 text-xs">
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewTag("");
              }}
              className="h-7 px-1.5 text-xs"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CompactProductCard({
  product,
  isSelected,
  onSelect,
}: {
  product: ProductBrain;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const imageUrl =
    !imageError && product.image_urls && product.image_urls.length > 0
      ? product.image_urls[0]
      : null;

  const formattedPrice = product.price
    ? `${product.currency || ""} ${product.price}`.trim()
    : null;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition-all duration-200 ${
        isSelected
          ? "border-primary bg-primary/[0.04] shadow-md ring-2 ring-primary"
          : "border-border bg-card shadow-sm hover:border-primary/50 hover:shadow"
      }`}
    >
      {/* Product Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            className="size-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground/50">
            <Package className="size-8" />
          </div>
        )}

        {/* Selection Indicator badge */}
        <div className="absolute right-2.5 top-2.5">
          {isSelected ? (
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <Check className="size-3.5 stroke-[3]" />
            </span>
          ) : (
            <span className="size-6 rounded-full border-2 border-background/80 bg-background/40 backdrop-blur-sm transition-colors group-hover:border-primary" />
          )}
        </div>
      </div>

      {/* Product Content: Name and Price */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <h4 className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
          {product.name}
        </h4>
        {formattedPrice && (
          <span className="mt-2 font-mono text-xs font-bold text-primary">
            {formattedPrice}
          </span>
        )}
      </div>
    </div>
  );
}

function ScrapePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [brain, setBrain] = useState<BrandBrain | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);

  // Workflow Step Management: 1 (Brand Understanding) -> 2 (Product Selection) -> 3 (Creative Theme) -> 4 (Creative Directions) -> 5 (Advertising Script)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 2 State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // Step 3 State (Creative Theme Archetype)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  // Step 4 State (3 Creative Directions generated by Gemini)
  const [directions, setDirections] = useState<CreativeDirection[] | null>(null);
  const [selectedDirectionIndex, setSelectedDirectionIndex] = useState<number | null>(null);
  const [isGeneratingDirections, setIsGeneratingDirections] = useState(false);

  // Step 5 State (Advertising Script / Concept)
  const [concept, setConcept] = useState<AdvertisingConcept | null>(null);
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const [isEditingConcept, setIsEditingConcept] = useState(false);
  const [conceptDuration, setConceptDuration] = useState<number>(20);
  const [conceptApproved, setConceptApproved] = useState(false);

  const handleSubmit = async (targetUrl?: string) => {
    const urlToScrape = (targetUrl ?? url).trim();
    if (!urlToScrape) return;
    if (targetUrl) setUrl(targetUrl);

    setLoading(true);
    setBrain(null);
    setError(null);
    setLoadingStep(1);
    setCurrentStep(1);
    setSelectedProductIndex(null);
    setSelectedTheme(null);
    setDirections(null);
    setSelectedDirectionIndex(null);
    setConcept(null);
    setConceptApproved(false);
    setSearchQuery("");
    setVisibleCount(INITIAL_VISIBLE_COUNT);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2400);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToScrape }),
      });

      const data = (await res.json()) as BrandBrain & { error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || "We couldn't fully understand this website. Try checking that the URL is correct.");
      }

      setBrain(data);
      toast.success(`Brand Understanding generated for ${data.brand_name || "your brand"}!`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "We couldn't fully understand this website. Try checking that the URL is correct.";
      setError(message);
      toast.error("Understanding failed");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleGenerateDirections = async (customTheme?: string) => {
    if (!brain || selectedProductIndex === null || !brain.products[selectedProductIndex]) {
      toast.error("Please select a product first.");
      return;
    }

    const themeId = customTheme || selectedTheme;
    if (!themeId) {
      toast.error("Please choose a creative theme.");
      return;
    }

    const themeObj = CREATIVE_DIRECTIONS.find((d) => d.id === themeId);
    const themeTitle = themeObj ? themeObj.title : themeId;
    const prod = brain.products[selectedProductIndex];

    setIsGeneratingDirections(true);

    try {
      const res = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brain,
          product: prod,
          themeId,
          themeTitle,
        }),
      });

      const data = (await res.json()) as { directions?: CreativeDirection[]; error?: string };
      if (!res.ok || data.error || !data.directions || data.directions.length === 0) {
        throw new Error(data.error || "Failed to generate creative directions.");
      }

      setDirections(data.directions);
      setSelectedDirectionIndex(0);
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success("Crafted 3 distinct creative directions with Gemini!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to generate creative directions.");
    } finally {
      setIsGeneratingDirections(false);
    }
  };

  const handleGenerateConcept = async (customDirectionIndex?: number, customDuration?: number) => {
    if (!brain || selectedProductIndex === null || !brain.products[selectedProductIndex]) {
      toast.error("Please select a product first.");
      return;
    }

    if (!selectedTheme) {
      toast.error("Please choose a creative theme.");
      return;
    }

    const dirIdx = customDirectionIndex ?? selectedDirectionIndex;
    const chosenDirection = (directions && dirIdx !== null && directions[dirIdx])
      ? directions[dirIdx]
      : undefined;

    const themeObj = CREATIVE_DIRECTIONS.find((d) => d.id === selectedTheme);
    const themeTitle = themeObj ? themeObj.title : selectedTheme;
    const prod = brain.products[selectedProductIndex];
    const dur = customDuration || conceptDuration || 20;

    setIsGeneratingConcept(true);
    setIsEditingConcept(false);

    try {
      const res = await fetch("/api/concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brain,
          product: prod,
          themeId: selectedTheme,
          themeTitle,
          duration: dur,
          selectedDirection: chosenDirection,
        }),
      });

      const data = (await res.json()) as AdvertisingConcept & { error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate advertising concept.");
      }

      setConcept(data);
      setConceptApproved(false);
      setCurrentStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success(
        data.source === "gemini"
          ? "Advertising script crafted with Gemini!"
          : "Advertising script generated!"
      );
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to generate advertising concept.");
    } finally {
      setIsGeneratingConcept(false);
    }
  };

  const handleApplyToWorkspace = async () => {
    if (!brain) return;
    setIsSaving(true);
    try {
      await saveBrandProfile({
        name: brain.brand_name,
        website: brain._meta?.scrapedUrl || url,
        industry: brain.visual_identity?.style || "Modern Commerce",
        audience: brain.target_audience.join(", "),
        offer: brain.key_selling_points.join(" | ") || brain.description,
        tone: brain.tone.join(", "),
        positioning: brain.positioning || brain.description,
        summary: brain.description,
        brandIdentity: brain.brand_personality.join(", "),
        vibeKeywords: [...brain.brand_personality, ...brain.tone],
        palette: {
          colors: brain.visual_identity.colors,
          style: brain.visual_identity.style,
        },
      });
      toast.success("Brand Brain saved as approved source of truth.");
      navigate({ to: "/onboarding" });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save to workspace — opening onboarding.");
      navigate({ to: "/onboarding" });
    } finally {
      setIsSaving(false);
    }
  };

  const copyJsonToClipboard = () => {
    if (!brain) return;
    void navigator.clipboard.writeText(JSON.stringify(brain, null, 2));
    toast.success("Brand Brain JSON copied to clipboard");
  };

  // Filtered products for Step 2 based on search query
  const filteredProducts = useMemo(() => {
    if (!brain?.products) return [];
    const query = searchQuery.trim().toLowerCase();
    const list = brain.products.map((p, idx) => ({ product: p, originalIndex: idx }));
    if (!query) return list;
    return list.filter(({ product }) => product.name.toLowerCase().includes(query));
  }, [brain?.products, searchQuery]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // "Let Orbit choose for me" algorithm
  const handleOrbitChoose = () => {
    if (!brain?.products || brain.products.length === 0) {
      toast.error("No products available to choose from.");
      return;
    }

    // Best choice: Product with both an image and a price
    let bestIndex = brain.products.findIndex(
      (p) => p.image_urls && p.image_urls.length > 0 && p.price
    );

    // Fallback: Product with at least an image
    if (bestIndex === -1) {
      bestIndex = brain.products.findIndex(
        (p) => p.image_urls && p.image_urls.length > 0
      );
    }

    // Default to the first product
    if (bestIndex === -1) {
      bestIndex = 0;
    }

    setSelectedProductIndex(bestIndex);
    const selectedProd = brain.products[bestIndex];
    if (selectedProd) {
      toast.success(`Orbit selected: ${selectedProd.name}`);
    }
  };

  const selectedProduct =
    selectedProductIndex !== null && brain?.products
      ? brain.products[selectedProductIndex]
      : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-10">
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
            <OrbitLogoMark size={26} className="text-primary" />
            <span>ORBIT</span>
            <span className="hidden rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary sm:inline">
              PHASE 1 · BRAND ENGINE
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
        {/* Step Indicator rendered when brain data is present */}
        {brain && !loading && <StepIndicator currentStep={currentStep} />}

        {/* STEP 1: Brand Scraping & Understanding */}
        {currentStep === 1 && (
          <>
            {/* Website URL Input */}
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" />
                <span>Step 1 · Brand Understanding</span>
              </div>

              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                Enter your website. Let Orbit understand your brand.
              </h1>

              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Orbit crawls your shop and brand pages with Firecrawl, extracts products and visual assets, and builds a
                structured Brand Brain powered by Gemini.
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
                    placeholder="https://examplebrand.com"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    disabled={loading}
                    className="h-13 w-full rounded-lg border border-border bg-card pl-11 pr-4 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !url.trim()}
                  size="lg"
                  className="h-13 px-8 text-base font-semibold shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Understanding…
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 size-5" /> Understand Brand
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>Try sample brands:</span>
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

            {/* Loading State */}
            {loading && (
              <div className="mx-auto mt-12 max-w-xl rounded-xl border border-border bg-card p-8 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">Understanding your brand...</p>
                    <p className="text-xs text-muted-foreground">
                      {LOADING_STEPS[Math.max(0, loadingStep - 1)]}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${
                        loadingStep >= step ? "bg-primary" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
                <p className="text-base font-semibold">We couldn't fully understand this website.</p>
                <p className="mt-1.5 text-xs opacity-90">{error}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Tip: Verify that the website is publicly online and accessible (e.g. https://yourbrand.com).
                </p>
              </div>
            )}

            {/* Brand Understanding Presentation (Without product catalogue) */}
            {brain && !loading && (
              <div className="mx-auto mt-12 max-w-5xl space-y-8">
                {/* Top Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <OrbitLogoMark size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Brand Brain Activated</h3>
                      <p className="text-[11px] text-muted-foreground">
                        {brain._meta?.usedFirecrawl ? "Firecrawl Scrape + Gemini" : "Direct Scrape + Gemini"} · Step 1 Complete
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowJsonModal(!showJsonModal)}
                      className="h-9 gap-1.5 text-xs"
                    >
                      <Code2 className="size-3.5" />
                      <span>{showJsonModal ? "Hide JSON" : "View JSON"}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyJsonToClipboard}
                      className="h-9 gap-1.5 text-xs"
                    >
                      <Copy className="size-3.5" />
                      <span>Copy Brain</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleApplyToWorkspace()}
                      disabled={isSaving}
                      className="h-9 gap-1.5 text-xs"
                    >
                      {isSaving ? "Saving…" : "Save to Workspace"}
                    </Button>
                  </div>
                </div>

                {/* Optional JSON Inspection Drawer */}
                {showJsonModal && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        BRAND BRAIN JSON SPECIFICATION
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowJsonModal(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <pre className="mt-3 max-h-80 overflow-auto rounded bg-card p-3 font-mono text-xs text-foreground">
                      {JSON.stringify(brain, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Main Brand Overview Card */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-md md:p-8">
                  {/* Header: Brand Name & URL */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
                    <div className="flex items-center gap-4">
                      {brain._meta?.logo ? (
                        <img
                          src={brain._meta.logo}
                          alt={`${brain.brand_name} logo`}
                          className="size-12 rounded-xl border border-border bg-background object-contain p-2 shadow-sm"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid size-12 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                          {brain.brand_name.slice(0, 1).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={brain.brand_name}
                            onChange={(e) => setBrain({ ...brain, brand_name: e.target.value })}
                            className="font-display text-2xl font-bold tracking-tight bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 -mx-1"
                          />
                        </div>
                        {brain._meta?.scrapedUrl && (
                          <a
                            href={brain._meta.scrapedUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                          >
                            <span>{brain._meta.domain}</span>
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {brain.products && brain.products.length > 0 && (
                        <Badge variant="secondary" className="font-mono text-xs">
                          {brain.products.length} Products Discovered
                        </Badge>
                      )}
                      <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        Approved Source of Truth
                      </Badge>
                    </div>
                  </div>

                  {/* Core Brand Description & Positioning */}
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <MessageSquareQuote className="size-3.5 text-primary" />
                        Description
                      </h4>
                      <textarea
                        rows={3}
                        value={brain.description}
                        onChange={(e) => setBrain({ ...brain, description: e.target.value })}
                        className="w-full rounded-lg border border-border bg-secondary/30 p-3 text-sm leading-relaxed text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Target className="size-3.5 text-primary" />
                        Positioning
                      </h4>
                      <textarea
                        rows={3}
                        value={brain.positioning}
                        onChange={(e) => setBrain({ ...brain, positioning: e.target.value })}
                        className="w-full rounded-lg border border-border bg-secondary/30 p-3 text-sm leading-relaxed text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Interactive Tag Sections */}
                  <div className="mt-8 grid gap-6 border-t border-border pt-6 md:grid-cols-2">
                    {/* Target Audience */}
                    <EditableTagList
                      title="Target Audience"
                      icon={Target}
                      tags={brain.target_audience}
                      onAdd={(tag) =>
                        setBrain({ ...brain, target_audience: [...brain.target_audience, tag] })
                      }
                      onRemove={(idx) =>
                        setBrain({
                          ...brain,
                          target_audience: brain.target_audience.filter((_, i) => i !== idx),
                        })
                      }
                      placeholder="e.g. Young professionals"
                    />

                    {/* Tone of Voice */}
                    <EditableTagList
                      title="Tone of Voice"
                      icon={Sparkles}
                      tags={brain.tone}
                      onAdd={(tag) => setBrain({ ...brain, tone: [...brain.tone, tag] })}
                      onRemove={(idx) =>
                        setBrain({ ...brain, tone: brain.tone.filter((_, i) => i !== idx) })
                      }
                      placeholder="e.g. Modern, Friendly"
                    />

                    {/* Brand Personality */}
                    <EditableTagList
                      title="Brand Personality"
                      icon={Flame}
                      tags={brain.brand_personality}
                      onAdd={(tag) =>
                        setBrain({ ...brain, brand_personality: [...brain.brand_personality, tag] })
                      }
                      onRemove={(idx) =>
                        setBrain({
                          ...brain,
                          brand_personality: brain.brand_personality.filter((_, i) => i !== idx),
                        })
                      }
                      placeholder="e.g. Confident, Minimal"
                    />

                    {/* Key Values */}
                    <EditableTagList
                      title="Key Values"
                      icon={HeartHandshake}
                      tags={brain.key_values}
                      onAdd={(tag) => setBrain({ ...brain, key_values: [...brain.key_values, tag] })}
                      onRemove={(idx) =>
                        setBrain({
                          ...brain,
                          key_values: brain.key_values.filter((_, i) => i !== idx),
                        })
                      }
                      placeholder="e.g. Sustainability"
                    />
                  </div>

                  {/* Selling Points & Claims */}
                  <div className="mt-8 grid gap-6 border-t border-border pt-6 md:grid-cols-2">
                    {/* Key Selling Points */}
                    <EditableTagList
                      title="Key Selling Points"
                      icon={Check}
                      tags={brain.key_selling_points}
                      onAdd={(tag) =>
                        setBrain({
                          ...brain,
                          key_selling_points: [...brain.key_selling_points, tag],
                        })
                      }
                      onRemove={(idx) =>
                        setBrain({
                          ...brain,
                          key_selling_points: brain.key_selling_points.filter((_, i) => i !== idx),
                        })
                      }
                      placeholder="e.g. Fast 2-day delivery"
                    />

                    {/* Important Claims */}
                    <EditableTagList
                      title="Important Claims & Guarantees"
                      icon={ShieldCheck}
                      tags={brain.important_claims}
                      onAdd={(tag) =>
                        setBrain({ ...brain, important_claims: [...brain.important_claims, tag] })
                      }
                      onRemove={(idx) =>
                        setBrain({
                          ...brain,
                          important_claims: brain.important_claims.filter((_, i) => i !== idx),
                        })
                      }
                      placeholder="e.g. 100% Organic Cotton"
                    />
                  </div>

                  {/* Visual Identity & Social Links */}
                  <div className="mt-8 grid gap-6 border-t border-border pt-6 md:grid-cols-2">
                    {/* Visual Identity */}
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Palette className="size-3.5 text-primary" />
                        Visual Identity & Colors
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        {brain.visual_identity.colors.map((color, cIdx) => (
                          <div
                            key={`${color}-${cIdx}`}
                            className="group relative flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2 py-1"
                          >
                            <div
                              className="size-4 rounded-full border border-border shadow-inner"
                              style={{ backgroundColor: color }}
                            />
                            <span className="font-mono text-xs uppercase">{color}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newColors = brain.visual_identity.colors.filter((_, i) => i !== cIdx);
                                setBrain({
                                  ...brain,
                                  visual_identity: { ...brain.visual_identity, colors: newColors },
                                });
                              }}
                              className="ml-1 text-muted-foreground hover:text-destructive"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Style: </span>
                        {brain.visual_identity.style} ·{" "}
                        <span className="font-semibold text-foreground">Imagery: </span>
                        {brain.visual_identity.imagery_style}
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Globe className="size-3.5 text-primary" />
                        Social Channels
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {brain.social_links.length > 0 ? (
                          brain.social_links.map((link) => {
                            let hostname = link;
                            try {
                              hostname = new URL(link).hostname.replace(/^www\./, "");
                            } catch {
                              // ignore
                            }
                            return (
                              <a
                                key={link}
                                href={link}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                              >
                                <span>{hostname}</span>
                                <ExternalLink className="size-3" />
                              </a>
                            );
                          })
                        ) : (
                          <span className="text-xs italic text-muted-foreground">
                            No public social links detected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Transition Button */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm md:p-8">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      Brand Understanding is ready
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Review the brand DNA above. Continue to choose which product to advertise.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="lg"
                    onClick={() => {
                      setCurrentStep(2);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="h-12 px-7 text-sm font-semibold shadow-md"
                  >
                    <span>Continue to Product Selection →</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* STEP 2: Select a Product to Advertise */}
        {currentStep === 2 && brain && (
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Step Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back to Brand Understanding</span>
                </button>
                <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                  Select a product to advertise
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Choose a product from your extracted catalogue to build your marketing campaign around.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOrbitChoose}
                  className="h-10 gap-1.5 border-primary/30 text-xs font-semibold text-primary hover:bg-primary/5"
                >
                  <Sparkles className="size-4 text-primary" />
                  <span>Let Orbit choose for me</span>
                </Button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Showing {visibleProducts.length} of {filteredProducts.length} products
                </span>
                {selectedProductIndex !== null && (
                  <Badge variant="secondary" className="gap-1 font-semibold text-primary">
                    <Check className="size-3" />
                    <span>1 Selected</span>
                  </Badge>
                )}
              </div>
            </div>

            {/* Compact Product Grid */}
            {visibleProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {visibleProducts.map(({ product, originalIndex }) => (
                  <CompactProductCard
                    key={`${product.name}-${originalIndex}`}
                    product={product}
                    isSelected={selectedProductIndex === originalIndex}
                    onSelect={() => setSelectedProductIndex(originalIndex)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Package className="mx-auto size-10 text-muted-foreground/40" />
                <p className="mt-3 text-base font-semibold">No matching products found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try adjusting your search query, or clear search to browse all products.
                </p>
                {searchQuery && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-xs"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}

            {/* Load More Button */}
            {visibleCount < filteredProducts.length && (
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="gap-2 px-6 text-xs font-semibold"
                >
                  <Plus className="size-3.5" />
                  <span>
                    Load more products ({filteredProducts.length - visibleCount} remaining)
                  </span>
                </Button>
              </div>
            )}

            {/* Active Selected Product Banner & Continue Button */}
            <div className="sticky bottom-6 z-20 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card/95 p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                {selectedProduct ? (
                  <>
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
                      {selectedProduct.image_urls?.[0] ? (
                        <img
                          src={selectedProduct.image_urls[0]}
                          alt={selectedProduct.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Package className="m-auto size-6 text-muted-foreground/60" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Selected Product
                      </p>
                      <h4 className="max-w-md truncate text-sm font-semibold text-foreground">
                        {selectedProduct.name}
                      </h4>
                      {selectedProduct.price && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {selectedProduct.currency || ""} {selectedProduct.price}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">No product selected yet</h4>
                    <p className="text-xs text-muted-foreground">
                      Pick a product from the grid above or click "Let Orbit choose for me".
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {selectedProductIndex !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProductIndex(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Change selection
                  </Button>
                )}

                <Button
                  type="button"
                  size="lg"
                  disabled={selectedProductIndex === null}
                  onClick={() => {
                    if (selectedProductIndex !== null) {
                      setCurrentStep(3);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="h-11 px-6 text-sm font-semibold shadow-md"
                >
                  <span>Continue to Creative Direction →</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Creative Direction (Theme Selection) */}
        {currentStep === 3 && brain && selectedProduct && (
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Step Header */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to Product Selection</span>
              </button>
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Choose your creative direction
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                How should Orbit bring your product to life?
              </p>
            </div>

            {/* Selected Product Compact Summary Area */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="size-11 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
                  {selectedProduct.image_urls?.[0] ? (
                    <img
                      src={selectedProduct.image_urls[0]}
                      alt={selectedProduct.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Package className="m-auto size-5 text-muted-foreground/60" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Target Product
                    </span>
                    {selectedProduct.category && (
                      <span className="rounded bg-secondary/80 px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                        {selectedProduct.category}
                      </span>
                    )}
                  </div>
                  <h4 className="max-w-md truncate text-sm font-semibold text-foreground">
                    {selectedProduct.name}
                  </h4>
                  {selectedProduct.price && (
                    <span className="font-mono text-xs font-semibold text-primary">
                      {selectedProduct.currency || ""} {selectedProduct.price}
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentStep(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Change product
              </Button>
            </div>

            {/* Visual Creative Themes Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              {CREATIVE_DIRECTIONS.map((dir) => {
                const isSelected = selectedTheme === dir.id;

                return (
                  <div
                    key={dir.id}
                    onClick={() => setSelectedTheme(dir.id)}
                    className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/[0.03] shadow-md ring-2 ring-primary"
                        : "border-border bg-card shadow-sm hover:border-primary/50 hover:shadow"
                    }`}
                  >
                    {/* Visual Preview Image */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40">
                      <img
                        src={dir.image}
                        alt={dir.title}
                        className="size-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Theme Badge */}
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                          {dir.badge}
                        </span>
                      </div>

                      {/* Selection Checkmark */}
                      <div className="absolute right-2.5 top-2.5">
                        {isSelected ? (
                          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-white">
                            <Check className="size-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="size-6 rounded-full border-2 border-white/80 bg-black/30 backdrop-blur-sm transition-colors group-hover:border-primary" />
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <h3 className="font-display text-base font-semibold text-foreground">
                          {dir.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {dir.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-primary">
                        <span>{isSelected ? "Theme selected" : "Click to select"}</span>
                        <ArrowRight className="size-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(2);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="h-10 text-xs"
                >
                  <ArrowLeft className="mr-1.5 size-3.5" /> Back
                </Button>
                {selectedTheme ? (
                  <p className="text-xs text-muted-foreground">
                    Selected theme:{" "}
                    <span className="font-semibold text-foreground">
                      {CREATIVE_DIRECTIONS.find((d) => d.id === selectedTheme)?.title}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Select a theme to unlock Continue.
                  </p>
                )}
              </div>

              <Button
                type="button"
                size="lg"
                disabled={!selectedTheme || isGeneratingDirections}
                onClick={() => {
                  if (selectedTheme) {
                    void handleGenerateDirections();
                  }
                }}
                className="h-10 px-6 text-xs font-semibold shadow-md"
              >
                {isGeneratingDirections ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    <span>Exploring Directions with Gemini…</span>
                  </>
                ) : (
                  <span>Continue to Creative Directions →</span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Creative Direction Selection */}
        {currentStep === 4 && brain && selectedProduct && (
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Step Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(3);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back to Creative Theme</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                    Step 4 of 5
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">Angle Exploration</span>
                </div>
                <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                  Choose a Creative Direction
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Orbit generated 3 distinct creative angles for{" "}
                  <strong className="text-foreground">{selectedProduct.name}</strong> under the{" "}
                  <strong className="text-foreground">
                    {CREATIVE_DIRECTIONS.find((d) => d.id === selectedTheme)?.title || "Creative"}
                  </strong>{" "}
                  theme. Pick the direction that best fits your campaign objective.
                </p>
              </div>

              {directions && directions.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingDirections}
                  onClick={() => void handleGenerateDirections()}
                  className="h-9 gap-1.5 text-xs"
                >
                  <RotateCcw className={`size-3.5 ${isGeneratingDirections ? "animate-spin" : ""}`} />
                  <span>Regenerate angles</span>
                </Button>
              )}
            </div>

            {/* Top Compact Summary: Product + Creative Theme */}
            <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
                  {selectedProduct.image_urls?.[0] ? (
                    <img
                      src={selectedProduct.image_urls[0]}
                      alt={selectedProduct.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Package className="m-auto size-6 text-muted-foreground/60" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Selected Product
                  </span>
                  <h4 className="truncate text-sm font-semibold text-foreground">
                    {selectedProduct.name}
                  </h4>
                  {selectedProduct.price && (
                    <span className="font-mono text-xs font-semibold text-primary">
                      {selectedProduct.currency || ""} {selectedProduct.price}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Selected Theme
                  </span>
                  <h4 className="truncate text-sm font-semibold text-foreground">
                    {CREATIVE_DIRECTIONS.find((d) => d.id === selectedTheme)?.title || "Commercial"}
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {CREATIVE_DIRECTIONS.find((d) => d.id === selectedTheme)?.description}
                  </span>
                </div>
              </div>
            </div>

            {/* The 3 Directions Cards */}
            {isGeneratingDirections ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center"
                  >
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <p className="text-xs font-semibold text-foreground">
                      Generating Angle {num}…
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Evaluating verified product facts and consumer hook
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-3">
                {(directions || []).map((dir, idx) => {
                  const isSelected = selectedDirectionIndex === idx;
                  return (
                    <div
                      key={dir.id || idx}
                      onClick={() => setSelectedDirectionIndex(idx)}
                      className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary/[0.03] shadow-md ring-2 ring-primary"
                          : "border-border bg-card shadow-sm hover:border-primary/50 hover:shadow"
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Card Header: Badge + Selection circle */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            Direction {idx + 1}
                          </span>

                          <div
                            className={`grid size-5 place-items-center rounded-full border transition-all ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card group-hover:border-primary/60"
                            }`}
                          >
                            {isSelected && <Check className="size-3 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Title & Core Idea */}
                        <div>
                          <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-foreground">
                            {dir.title}
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {dir.coreIdea}
                          </p>
                        </div>

                        {/* Opening Hook Quote */}
                        <div className="rounded-lg border border-border/70 bg-secondary/40 p-3">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Sparkles className="size-3 text-primary" />
                            <span>Opening Hook</span>
                          </div>
                          <p className="mt-1 text-xs italic font-medium text-foreground">
                            "{dir.hook}"
                          </p>
                        </div>

                        {/* Target Audience / Situation */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Audience & Context
                          </span>
                          <p className="text-xs text-foreground/90">
                            {dir.targetAudienceOrSituation}
                          </p>
                        </div>

                        {/* Creative Rationale */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Creative Rationale
                          </span>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {dir.creativeRationale}
                          </p>
                        </div>

                        {/* Verified Facts Used */}
                        {dir.relevantProductFacts && dir.relevantProductFacts.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              <ShieldCheck className="size-3 text-primary" />
                              <span>Verified Facts Used</span>
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {dir.relevantProductFacts.map((fact, fIdx) => (
                                <span
                                  key={fIdx}
                                  className="rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
                                >
                                  {fact}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom CTA */}
                      <div className="mt-6 border-t border-border/50 pt-3">
                        <div
                          className={`flex items-center justify-between text-xs font-semibold transition-colors ${
                            isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          <span>{isSelected ? "Selected Direction" : "Select this direction"}</span>
                          <ArrowRight className="size-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(3);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="h-10 text-xs"
                >
                  <ArrowLeft className="mr-1.5 size-3.5" /> Back to Creative Theme
                </Button>

                {selectedDirectionIndex !== null && directions?.[selectedDirectionIndex] ? (
                  <p className="text-xs text-muted-foreground">
                    Selected angle:{" "}
                    <span className="font-semibold text-foreground">
                      {directions[selectedDirectionIndex]?.title}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Select a direction to proceed to storyboard generation.
                  </p>
                )}
              </div>

              <Button
                type="button"
                size="lg"
                disabled={selectedDirectionIndex === null || isGeneratingConcept}
                onClick={() => {
                  if (selectedDirectionIndex !== null) {
                    void handleGenerateConcept();
                  }
                }}
                className="h-10 px-6 text-xs font-semibold shadow-md"
              >
                {isGeneratingConcept ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    <span>Generating Storyboard & Script with Gemini…</span>
                  </>
                ) : (
                  <span>Generate Advertising Script →</span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Advertising Concept Generation & Review */}
        {currentStep === 5 && brain && selectedProduct && !conceptApproved && (
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Step Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(4);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back to Creative Directions</span>
                </button>
                <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                  Your Advertising Concept
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review the brand-specific advertising concept generated by Orbit before video production.
                </p>
              </div>

              {concept && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isGeneratingConcept}
                    onClick={() => void handleGenerateConcept()}
                    className="h-9 gap-1.5 text-xs"
                  >
                    <RotateCcw className={`size-3.5 ${isGeneratingConcept ? "animate-spin" : ""}`} />
                    <span>Regenerate concept</span>
                  </Button>

                  <Button
                    type="button"
                    variant={isEditingConcept ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setIsEditingConcept(!isEditingConcept)}
                    className="h-9 gap-1.5 text-xs"
                  >
                    <Edit3 className="size-3.5" />
                    <span>{isEditingConcept ? "Done Editing" : "Edit concept"}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Top Compact Summary: Product + Creative Theme + Selected Angle + Duration */}
            <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-4">
              {/* Product */}
              <div className="flex items-center gap-3">
                <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
                  {selectedProduct.image_urls?.[0] ? (
                    <img
                      src={selectedProduct.image_urls[0]}
                      alt={selectedProduct.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Package className="m-auto size-6 text-muted-foreground/60" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Selected Product
                  </span>
                  <h4 className="truncate text-sm font-semibold text-foreground">
                    {selectedProduct.name}
                  </h4>
                  {selectedProduct.price && (
                    <span className="font-mono text-xs font-semibold text-primary">
                      {selectedProduct.currency || ""} {selectedProduct.price}
                    </span>
                  )}
                </div>
              </div>

              {/* Theme */}
              <div className="flex items-center gap-3 border-t border-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Creative Theme
                  </span>
                  <h4 className="truncate text-sm font-semibold text-foreground">
                    {CREATIVE_DIRECTIONS.find((d) => d.id === selectedTheme)?.title || "Commercial"}
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {CREATIVE_DIRECTIONS.find((d) => d.id === selectedTheme)?.badge || "Cinematic"}
                  </span>
                </div>
              </div>

              {/* Chosen Direction */}
              <div className="flex items-center gap-3 border-t border-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Lightbulb className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Chosen Direction
                  </span>
                  <h4 className="truncate text-sm font-semibold text-foreground">
                    {concept?.selectedDirection?.title ||
                      (directions && selectedDirectionIndex !== null && directions[selectedDirectionIndex]?.title) ||
                      "Core Angle"}
                  </h4>
                  <span className="truncate block text-[11px] text-muted-foreground">
                    {concept?.selectedDirection?.coreIdea || "Grounded advertising approach"}
                  </span>
                </div>
              </div>

              {/* Proposed Duration */}
              <div className="flex items-center justify-between border-t border-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Target Duration
                    </span>
                    <h4 className="font-mono text-sm font-bold text-foreground">
                      ~{concept?.duration || conceptDuration} seconds
                    </h4>
                    <span className="text-[11px] text-muted-foreground">Standard Short Video</span>
                  </div>
                </div>

                {isEditingConcept && (
                  <select
                    value={concept?.duration || conceptDuration}
                    onChange={(e) => {
                      const newDur = Number(e.target.value);
                      setConceptDuration(newDur);
                      if (concept) setConcept({ ...concept, duration: newDur });
                    }}
                    className="h-8 rounded border border-border bg-background px-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value={15}>15s</option>
                    <option value={20}>20s</option>
                    <option value={30}>30s</option>
                  </select>
                )}
              </div>
            </div>

            {/* Loading Concept State */}
            {isGeneratingConcept && (
              <div className="rounded-xl border border-border bg-card p-12 text-center shadow-md">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                  <Loader2 className="size-6 animate-spin" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  Crafting your advertising concept with Gemini...
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Analyzing brand voice, verified selling points, and building your scene-by-scene storyboard.
                </p>
              </div>
            )}

            {/* Generated Concept View */}
            {!isGeneratingConcept && concept && (
              <div className="space-y-6">
                {/* 1. Creative Idea */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="size-4 text-primary" />
                      <h3 className="font-display text-base font-semibold text-foreground">
                        Creative Idea
                      </h3>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      Central Thesis
                    </Badge>
                  </div>

                  {isEditingConcept ? (
                    <textarea
                      rows={2}
                      value={concept.campaignIdea}
                      onChange={(e) => setConcept({ ...concept, campaignIdea: e.target.value })}
                      className="mt-3 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">
                      {concept.campaignIdea}
                    </p>
                  )}
                </div>

                {/* 2. The Hook */}
                <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      <h3 className="font-display text-base font-semibold text-primary">
                        The Hook
                      </h3>
                    </div>
                    <span className="font-mono text-xs font-bold text-primary">
                      First 3 Seconds
                    </span>
                  </div>

                  {isEditingConcept ? (
                    <input
                      type="text"
                      value={concept.hook}
                      onChange={(e) => setConcept({ ...concept, hook: e.target.value })}
                      className="mt-3 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <p className="mt-3 text-base font-semibold leading-relaxed text-foreground">
                      "{concept.hook}"
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Grabs audience attention immediately before viewers scroll, tailored to the {concept.themeTitle} theme.
                  </p>
                </div>

                {/* 3. Storyboard (Scene-by-Scene Cards) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Film className="size-4 text-primary" />
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        Storyboard & Narrative Arc
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {concept.storyboard.length} Scenes · ~{concept.duration}s Total
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {concept.storyboard.map((scene, idx) => (
                      <div
                        key={scene.sceneNumber || idx}
                        className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-border/80"
                      >
                        {/* Scene Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">
                              {scene.sceneNumber}
                            </span>
                            <span className="font-display text-sm font-semibold text-foreground">
                              Scene {scene.sceneNumber}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              ({scene.timestamp})
                            </span>
                          </div>

                          <span className="rounded bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {scene.purpose}
                          </span>
                        </div>

                        {/* Scene Details */}
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          {/* Visual Description */}
                          <div className="space-y-1.5 md:col-span-1">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Visual Direction
                            </span>
                            {isEditingConcept ? (
                              <textarea
                                rows={3}
                                value={scene.visualDescription}
                                onChange={(e) => {
                                  const updated = [...concept.storyboard];
                                  const targetScene = updated[idx];
                                  if (targetScene) {
                                    targetScene.visualDescription = e.target.value;
                                    setConcept({ ...concept, storyboard: updated });
                                  }
                                }}
                                className="w-full rounded border border-border bg-background p-2 text-xs text-foreground focus:border-primary focus:outline-none"
                              />
                            ) : (
                              <p className="text-xs leading-relaxed text-foreground">
                                {scene.visualDescription}
                              </p>
                            )}
                          </div>

                          {/* Voiceover / Dialogue */}
                          <div className="space-y-1.5 md:col-span-1">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Voiceover / Dialogue
                            </span>
                            {isEditingConcept ? (
                              <textarea
                                rows={3}
                                value={scene.voiceoverOrDialogue}
                                onChange={(e) => {
                                  const updated = [...concept.storyboard];
                                  const targetScene = updated[idx];
                                  if (targetScene) {
                                    targetScene.voiceoverOrDialogue = e.target.value;
                                    setConcept({ ...concept, storyboard: updated });
                                  }
                                }}
                                className="w-full rounded border border-border bg-background p-2 text-xs text-foreground focus:border-primary focus:outline-none"
                              />
                            ) : (
                              <p className="text-xs italic leading-relaxed text-muted-foreground">
                                {scene.voiceoverOrDialogue ? `"${scene.voiceoverOrDialogue}"` : "None (ambient audio)"}
                              </p>
                            )}
                          </div>

                          {/* On-screen Text */}
                          <div className="space-y-1.5 md:col-span-1">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              On-Screen Text
                            </span>
                            {isEditingConcept ? (
                              <input
                                type="text"
                                value={scene.onScreenText}
                                onChange={(e) => {
                                  const updated = [...concept.storyboard];
                                  const targetScene = updated[idx];
                                  if (targetScene) {
                                    targetScene.onScreenText = e.target.value;
                                    setConcept({ ...concept, storyboard: updated });
                                  }
                                }}
                                className="w-full rounded border border-border bg-background p-2 text-xs text-foreground focus:border-primary focus:outline-none"
                              />
                            ) : (
                              <div className="rounded border border-border/60 bg-secondary/40 px-2.5 py-1.5 font-mono text-xs font-semibold text-foreground">
                                {scene.onScreenText || "—"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Call to Action */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                      <Target className="size-4 text-primary" />
                      <h3 className="font-display text-base font-semibold text-foreground">
                        Call to Action
                      </h3>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      Closing Message
                    </Badge>
                  </div>

                  {isEditingConcept ? (
                    <input
                      type="text"
                      value={concept.callToAction}
                      onChange={(e) => setConcept({ ...concept, callToAction: e.target.value })}
                      className="mt-3 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-semibold text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <p className="mt-3 text-base font-semibold text-primary">
                      {concept.callToAction}
                    </p>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentStep(4);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="h-10 text-xs"
                    >
                      <ArrowLeft className="mr-1.5 size-3.5" /> Back to Creative Directions
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Ready for production? Approve and continue to Video Generation.
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="lg"
                      onClick={() => {
                        setConceptApproved(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        toast.success("Advertising concept approved!");
                      }}
                      className="h-10 px-6 text-xs font-semibold shadow-md"
                    >
                      <span>Approve & Continue to Video Generation →</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5 (Approved): Video Generation Stage */}
        {currentStep === 5 && brain && selectedProduct && concept && conceptApproved && (
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <div className="rounded-2xl border border-primary/20 bg-card p-10 shadow-lg">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
                <Clapperboard className="size-8" />
              </div>

              <span className="mt-6 inline-block rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
                CONCEPT APPROVED
              </span>

              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Video Generation Stage
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
                Your advertising concept for <strong className="text-foreground">{selectedProduct.name}</strong> ({concept.themeTitle}) is approved and staged for video production.
              </p>

              {/* Concept summary highlight */}
              <div className="mx-auto mt-6 max-w-md rounded-xl border border-border bg-secondary/40 p-4 text-left">
                {concept.selectedDirection && (
                  <div className="border-b border-border/60 pb-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Creative Direction
                    </p>
                    <p className="mt-1 text-xs font-semibold text-foreground">
                      {concept.selectedDirection.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {concept.selectedDirection.coreIdea}
                    </p>
                  </div>
                )}

                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Approved Hook
                </p>
                <p className="mt-1 text-xs font-semibold text-foreground">"{concept.hook}"</p>

                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Call to Action
                </p>
                <p className="mt-1 text-xs font-semibold text-primary">{concept.callToAction}</p>

                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Duration & Scenes
                </p>
                <p className="mt-1 font-mono text-xs text-foreground">
                  ~{concept.duration}s · {concept.storyboard.length} Storyboard Scenes
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConceptApproved(false)}
                  className="text-xs"
                >
                  <ArrowLeft className="mr-1.5 size-3.5" /> Back to Review Concept
                </Button>

                <Button
                  type="button"
                  onClick={() => void handleApplyToWorkspace()}
                  disabled={isSaving}
                  className="text-xs font-semibold shadow-md"
                >
                  {isSaving ? "Saving…" : "Save Brand Brain to Workspace →"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

