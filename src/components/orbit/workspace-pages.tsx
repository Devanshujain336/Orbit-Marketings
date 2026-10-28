import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Bot,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clapperboard,
  Copy,
  ExternalLink,
  Flame,
  Gauge,
  Globe,
  Inbox,
  Loader2,
  Megaphone,
  MessageCircle,
  Plus,
  Radio,
  RefreshCw,
  Rocket,
  Send,
  Settings2,
  Sparkles,
  Target,
  Timer,
  Trash2,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/orbit/app-shell";
import { Chip, EmptyState, Panel, SpeedLine, StatTile, TierBadge } from "@/components/orbit/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTENT_STAGES,
  SHOOT_TRAIL,
  VIRAL_PATTERNS,
  createContentItem,
  createSchedule,
  createShootRequest,
  deleteContentItem,
  deleteSchedule,
  estimateReach,
  publishDueSchedules,
  publishSchedule,
  sendLeadMessage,
  suggestedSlot,
  toLocalInputValue,
  updateBusinessChannels,
  updateContentItemStatus,
  updateSchedule,
  fetchBusiness,
  fetchContentItems,
  fetchLeadMessages,
  fetchLeads,
  fetchSchedules,
  fetchShootRequests,
  formatDateTime,
  humanize,
  saveBrandProfile,
  simulateLead,
  tierRank,
  updateLeadStatus,
  type Business,
  type ContentItem,
  type Lead,
  type Schedule,
} from "@/lib/orbit";
import { cn } from "@/lib/utils";
import { analyzeBrand } from "@/lib/orbit-ai.functions";

function useOrbitData() {
  const business = useQuery({ queryKey: ["business"], queryFn: fetchBusiness });
  const content = useQuery({ queryKey: ["content-items"], queryFn: fetchContentItems });
  const schedules = useQuery({ queryKey: ["schedules"], queryFn: fetchSchedules });
  const leads = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });
  const shoots = useQuery({ queryKey: ["shoot-requests"], queryFn: fetchShootRequests });

  return { business, content, schedules, leads, shoots };
}

function invalidateOrbit(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["business"] });
  queryClient.invalidateQueries({ queryKey: ["content-items"] });
  queryClient.invalidateQueries({ queryKey: ["schedules"] });
  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["shoot-requests"] });
}

function safeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function leadStats(leads: Lead[]) {
  const open = leads.filter((lead) => lead.status !== "won" && lead.status !== "lost");
  const high = open.filter((lead) => lead.tier === "high").length;
  const won = leads.filter((lead) => lead.status === "won").length;
  const averageScore = leads.length
    ? Math.round(leads.reduce((total, lead) => total + safeNumber(lead.score), 0) / leads.length)
    : 0;
  return { open: open.length, high, won, averageScore };
}

function channelLabel(value: string) {
  if (value === "whatsapp") return "WhatsApp";
  if (value === "instagram") return "Instagram";
  if (value === "facebook") return "Facebook";
  return humanize(value);
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <span className="label-xs block pb-2">{children}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <FormLabel>{label}</FormLabel>
      {children}
    </label>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = status === "published" || status === "won" ? "border-signal/40 bg-signal/15 text-signal" : status === "scheduled" || status === "ready" ? "border-heat/40 bg-heat/15 text-heat" : "border-border bg-secondary text-muted-foreground";
  return (
    <span className={cn("num inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]", tone)}>
      {humanize(status)}
    </span>
  );
}

function MiniMetric({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/50 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-primary/15 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="label-xs">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function LeadRow({ lead, selected, onSelect }: { lead: Lead; selected: boolean; onSelect: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onSelect}
      className={cn(
        "h-auto w-full justify-start rounded-sm border border-transparent p-3 text-left hover:border-border hover:bg-accent",
        selected && "border-signal/40 bg-signal/10",
      )}
    >
      <span className="flex w-full min-w-0 items-start gap-3">
        <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-sm bg-secondary text-muted-foreground">
          <MessageCircle className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold">{lead.name ?? lead.handle}</span>
            <TierBadge tier={lead.tier} score={lead.score} />
          </span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">{lead.intent_summary}</span>
          <span className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{channelLabel(lead.channel)}</span>
            <span>·</span>
            <span>{formatDateTime(lead.last_message_at)}</span>
          </span>
        </span>
      </span>
    </Button>
  );
}

function LeadThread({ lead }: { lead: Lead | undefined }) {
  const queryClient = useQueryClient();
  const messages = useQuery({
    queryKey: ["lead-messages", lead?.id],
    queryFn: () => fetchLeadMessages(lead?.id ?? ""),
    enabled: Boolean(lead?.id),
  });
  const [replyText, setReplyText] = useState("");
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead status updated");
    },
    onError: () => toast.error("Could not update lead"),
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => (lead ? sendLeadMessage(lead.id, body, false) : Promise.reject(new Error("No lead selected"))),
    onSuccess: () => {
      if (lead) queryClient.invalidateQueries({ queryKey: ["lead-messages", lead.id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setReplyText("");
      toast.success("Reply sent to buyer");
    },
    onError: () => toast.error("Could not send reply"),
  });

  if (!lead) {
    return <EmptyState title="No lead selected" hint="Pick a conversation from the stack." />;
  }

  const QUICK_REPLIES = [
    "Confirmed! What's your target launch date and monthly budget?",
    "Sounds like a great fit. Would a quick 15-min walkthrough this Thursday work?",
    "We can handle scripting, production, and instant lead triage for this.",
  ];

  return (
    <div className="flex min-h-[560px] flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div>
          <p className="label-xs">{channelLabel(lead.channel)} · {lead.handle}</p>
          <h2 className="mt-1 text-xl font-semibold">{lead.name ?? lead.handle}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{lead.reason}</p>
        </div>
        <div className="flex items-center gap-2">
          <TierBadge tier={lead.tier} score={lead.score} />
          <StatusPill status={lead.status} />
        </div>
      </div>

      <div className="flex-1 space-y-3 p-4 overflow-y-auto max-h-[380px]">
        {(messages.data ?? []).map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[82%] rounded-md border border-border p-3 text-sm",
              message.direction === "outbound" ? "ml-auto bg-primary/15 border-primary/30 text-foreground" : "bg-secondary/70",
            )}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
            <p className="label-xs mt-2 text-[10px] text-muted-foreground">{message.automated ? "Auto reply" : humanize(message.direction)}</p>
          </div>
        ))}
        {messages.isLoading ? <p className="text-sm text-muted-foreground">Loading thread…</p> : null}
      </div>

      <div className="border-t border-border p-4 bg-card/40 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_REPLIES.map((quick, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setReplyText(quick)}
              className="text-[11px] rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              + {quick.slice(0, 36)}…
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type outbound reply or prompt to this lead…"
            className="min-h-16 bg-background resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && replyText.trim()) {
                e.preventDefault();
                sendMutation.mutate(replyText.trim());
              }
            }}
          />
          <Button
            type="button"
            className="self-end h-16 px-4"
            disabled={!replyText.trim() || sendMutation.isPending}
            onClick={() => sendMutation.mutate(replyText.trim())}
          >
            <Send className="size-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => statusMutation.mutate({ id: lead.id, status: "won" })} disabled={statusMutation.isPending}>
              <Trophy className="size-3.5 mr-1" /> Mark won
            </Button>
            <Button size="sm" variant="secondary" onClick={() => statusMutation.mutate({ id: lead.id, status: "qualified" })} disabled={statusMutation.isPending}>
              <CheckCircle2 className="size-3.5 mr-1" /> Qualify
            </Button>
            <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: lead.id, status: "lost" })} disabled={statusMutation.isPending}>
              Close out
            </Button>
          </div>
          <span className="text-[11px] text-muted-foreground">Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}

function BusinessSummary({ business }: { business?: Business | null | undefined }) {
  const vibe = business?.vibe_keywords ?? [];
  return (
    <Panel title="Brand telemetry">
      <div className="space-y-4">
        <div>
          <p className="label-xs">Current profile</p>
          <h3 className="mt-1 text-2xl font-semibold">{business?.name ?? "Orbit demo business"}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{business?.positioning ?? "Add the brand profile to generate sharper content and replies."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {vibe.length ? vibe.map((item) => <Chip key={item}>{item}</Chip>) : <Chip>Awaiting scan</Chip>}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniMetric icon={Megaphone} label="Offer" value={business?.offer ?? "Not set"} />
          <MiniMetric icon={Target} label="Audience" value={business?.audience ?? "Not set"} />
          <MiniMetric icon={Radio} label="Tone" value={business?.tone ?? "Direct"} />
        </div>
      </div>
    </Panel>
  );
}

export function DashboardPage() {
  const { business, content, schedules, leads, shoots } = useOrbitData();
  const leadScore = leadStats(leads.data ?? []);
  const scheduledBudget = (schedules.data ?? []).reduce((total, schedule) => total + safeNumber(schedule.ad_budget), 0);
  const readyVideos = (content.data ?? []).filter((item) => item.status === "ready" || item.status === "scheduled").length;
  const recentLeads = [...(leads.data ?? [])].sort((a, b) => tierRank(a.tier) - tierRank(b.tier)).slice(0, 4);

  return (
    <AppShell title={`Good morning, ${business.data?.name ?? "Founder"}`} subtitle="Live view of content, distribution, and lead triage across your workspace.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile label="Hot leads" value={leadScore.high} hint={`${leadScore.open} open conversations`} tone="signal" />
          <StatTile label="Avg AI score" value={leadScore.averageScore} unit="/100" hint="Qualification confidence" tone="cool" />
          <StatTile label="Ready videos" value={readyVideos} hint="Ready or scheduled" tone="heat" />
          <StatTile label="Boost spend" value={`₹${scheduledBudget.toLocaleString("en-IN")}`} hint="Scheduled media budget" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Engine map" bodyClassName="p-0">
            <div className="grid md:grid-cols-4">
              {[
                { icon: Rocket, label: "Onboard", text: "Scan brand, audience, offer." },
                { icon: Clapperboard, label: "Create", text: "Offline shoots or AI video drafts." },
                { icon: CalendarClock, label: "Distribute", text: "Schedule and boost to Meta." },
                { icon: Inbox, label: "Qualify", text: "Reply instantly and tier leads." },
              ].map((item, index) => (
                <div key={item.label} className="relative border-b border-border p-5 md:border-b-0 md:border-r last:border-r-0">
                  <item.icon className="size-5 text-signal" />
                  <p className="label-xs mt-4">Stage {index + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold">{item.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent high-value signals" className="xl:col-span-1">
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="group relative flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                        {lead.name?.[0]?.toUpperCase() ?? lead.handle?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="truncate text-sm font-semibold">{lead.name ?? lead.handle}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{lead.channel}</p>
                      </div>
                    </div>
                    <TierBadge tier={lead.tier} score={lead.score} />
                  </div>
                  <div className="mt-1 rounded-md bg-secondary/50 p-2">
                    <p className="line-clamp-2 text-xs text-secondary-foreground/80">{lead.intent_summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <BusinessSummary business={business.data} />
          <Panel title="Production queue" className="lg:col-span-2">
            <div className="grid gap-3 md:grid-cols-2">
              {(shoots.data ?? []).slice(0, 4).map((shoot) => (
                <div key={shoot.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-transform hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{shoot.partner}</p>
                      <p className="label-xs mt-1">{shoot.location ?? "Location TBD"}</p>
                    </div>
                    <StatusPill status={shoot.status} />
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{shoot.brief}</p>
                  <div className="mt-auto pt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-signal transition-all" style={{ width: shoot.status === "delivered" ? "100%" : shoot.status === "edited" ? "80%" : shoot.status === "filmed" ? "60%" : "30%" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

const STARTUP_PRESETS = [
  {
    label: "B2B SaaS",
    name: "PulseScale",
    website: "https://pulsescale.io",
    industry: "Cloud Infrastructure & SRE",
    audience: "Engineering leaders, VP of Eng, and DevOps teams at scaling startups",
    offer: "Zero-latency Kubernetes auto-scaling and cost anomaly defense that cuts AWS bills by 42% in 24 hours.",
    tone: "technical, confident, outcome-led",
    positioning: "PulseScale cuts cloud infrastructure waste by 42% in 24 hours with autonomous Kubernetes auto-scaling built for high-growth engineering teams.",
    vibeKeywords: ["autonomous", "zero-latency", "cost-defense", "engineered", "high-velocity"],
    videoAngles: [
      "The exact query that costs your startup $12,000 extra on AWS each month",
      "POV: DevOps engineer sleeping through a Black Friday traffic surge with PulseScale",
      "3 Kubernetes mistakes senior engineers make that burn investor capital",
    ],
    qualifyingQuestions: [
      "What is your current monthly AWS or GCP cloud spend?",
      "How many Kubernetes clusters are you currently running in production?",
      "Are you looking to optimize costs within the next 30 days?",
    ],
  },
  {
    label: "Creative Agency",
    name: "Velocity Studio",
    website: "https://velocity.studio",
    industry: "Short-Form Video & Growth Marketing",
    audience: "Funded tech founders, consumer brands, and D2C scale-ups",
    offer: "High-retention vertical video production, scripting, and organic Meta distribution that turns viewers into inbound customers.",
    tone: "bold, punchy, energetic, premium",
    positioning: "Velocity Studio transforms product vision into high-retention vertical video campaigns that generate real buyer demand without endless agency handoffs.",
    vibeKeywords: ["high-retention", "punchy", "motion-first", "conversion", "aesthetic"],
    videoAngles: [
      "Why your $20,000 brand video got 400 views and 0 customers",
      "The 3-second hook structure that converted $140,000 for a bootstrapped SaaS",
      "POV: Your DM inbox 48 hours after launching our organic video sprint",
    ],
    qualifyingQuestions: [
      "What is your target monthly revenue or lead volume goal?",
      "Do you have existing video footage or do you need on-location filming?",
      "What timeline are you targeting for campaign launch?",
    ],
  },
  {
    label: "AI Platform",
    name: "Orbit",
    website: "https://orbit.ai",
    industry: "Autonomous Growth & AI Marketing",
    audience: "Solo founders, growth teams, and operators who need predictable customer acquisition",
    offer: "Always-on marketing engine that creates vertical video hooks, boosts posts, and instantly qualifies buyer DMs.",
    tone: "fast, sharp, bold, telemetry-driven",
    positioning: "Orbit is the autonomous marketing engine for startups — turning brand DNA into high-converting video and instant lead qualification 24/7.",
    vibeKeywords: ["autonomous", "fast-reply", "telemetry", "high-velocity", "demand-engine"],
    videoAngles: [
      "The reason buyers leave your site without ever sending a message",
      "POV: your inbox after Orbit answers every buyer DM in 4 seconds",
      "3 things Orbit does that marketing agencies charge $8,000/mo for",
    ],
    qualifyingQuestions: [
      "What are you trying to fix in your lead flow in the next 30 days?",
      "What monthly ad or media boost budget have you set aside?",
      "Who else signs off on the decision with you?",
    ],
  },
  {
    label: "D2C Brand",
    name: "Aura Brew",
    website: "https://aurabrew.co",
    industry: "Functional Beverage & Wellness",
    audience: "Health-conscious creators, founders, and professionals seeking clean afternoon energy",
    offer: "Organic ceremonial-grade matcha infused with lion's mane and L-theanine for 6 hours of clean, crash-free focus.",
    tone: "warm, vibrant, mindful, aesthetic",
    positioning: "Aura Brew powers high-focus workdays with ceremonial-grade organic adaptogenic matcha that eliminates coffee jitters and crashes.",
    vibeKeywords: ["clean-energy", "ceremonial", "crash-free", "focus", "organic"],
    videoAngles: [
      "Why high-output founders are ditching their 2 PM espresso for this green tin",
      "POV: The difference between 3 cups of coffee vs 1 scoop of Aura Brew at 3 PM",
      "3 ingredients hiding in commercial energy drinks that ruin your sleep cycle",
    ],
    qualifyingQuestions: [
      "Are you buying for personal daily use or stocking an office team?",
      "Have you tried ceremonial Japanese matcha before?",
      "Would you prefer a 30-day starter kit with a bamboo whisk?",
    ],
  },
];

export function OnboardingPage() {
  const queryClient = useQueryClient();
  const business = useQuery({ queryKey: ["business"], queryFn: fetchBusiness });
  const [form, setForm] = useState({
    name: "",
    website: "",
    industry: "",
    audience: "",
    offer: "",
    tone: "",
    positioning: "",
  });

  const [dnaChips, setDnaChips] = useState<string[]>([]);
  const [newChipInput, setNewChipInput] = useState("");
  const [videoAngles, setVideoAngles] = useState<string[]>([]);
  const [qualifyingQuestions, setQualifyingQuestions] = useState<string[]>([]);
  const [isScanningUrl, setIsScanningUrl] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [copiedPositioning, setCopiedPositioning] = useState(false);

  // Sync fetched business data into form once loaded
  useEffect(() => {
    if (business.data) {
      setForm((prev) => ({
        name: prev.name || business.data?.name || "",
        website: prev.website || business.data?.website || "",
        industry: prev.industry || business.data?.industry || "",
        audience: prev.audience || business.data?.audience || "",
        offer: prev.offer || business.data?.offer || "",
        tone: prev.tone || business.data?.tone || "",
        positioning: prev.positioning || business.data?.positioning || "",
      }));

      // Parse qualifying questions from auto_reply_template
      try {
        const raw = business.data.auto_reply_template;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQualifyingQuestions(parsed);
          }
        }
      } catch {
        // ignore
      }

      // Video angles and DNA chips from vibe_keywords
      const vibe = business.data.vibe_keywords ?? [];
      const angles = vibe.filter((k) => k.length > 30);
      const chips = vibe.filter((k) => k.length <= 30);
      if (angles.length > 0) setVideoAngles(angles);
      if (chips.length > 0) setDnaChips(chips);
    }
  }, [business.data]);

  const handlePreset = (preset: (typeof STARTUP_PRESETS)[number]) => {
    setForm({
      name: preset.name,
      website: preset.website,
      industry: preset.industry,
      audience: preset.audience,
      offer: preset.offer,
      tone: preset.tone,
      positioning: preset.positioning,
    });
    setDnaChips(preset.vibeKeywords);
    setVideoAngles(preset.videoAngles);
    setQualifyingQuestions(preset.qualifyingQuestions);
    toast.success(`Loaded preset: ${preset.label}`);
  };

  const handleQuickScan = async () => {
    const target = form.website.trim();
    if (!target) {
      toast.error("Please enter a website URL to scan");
      return;
    }
    setIsScanningUrl(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const intel = await res.json();
      if (!res.ok || intel.error) throw new Error(intel.error || "Could not read that site");

      setForm((prev) => ({
        ...prev,
        name: intel.site?.siteName || prev.name || intel.site?.domain || "My Brand",
        website: intel.site?.url || target,
        industry: intel.brandIdentity || prev.industry,
        audience: intel.targetAudience || prev.audience,
        offer: intel.summary || prev.offer,
        tone: (intel.vibeKeywords || []).slice(0, 3).join(", ") || prev.tone,
        positioning: intel.summary || prev.positioning,
      }));

      if (intel.vibeKeywords?.length) {
        setDnaChips(intel.vibeKeywords.slice(0, 6));
      }
      if (intel.videoAngles?.length) {
        setVideoAngles(intel.videoAngles.map((a: { hook?: string } | string) => (typeof a === "string" ? a : a.hook || "")));
      }
      if (intel.qualifyingQuestions?.length) {
        setQualifyingQuestions(intel.qualifyingQuestions.slice(0, 3));
      }
      toast.success("Website analyzed! Positioning, hooks, and buyer profile populated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to scan website");
    } finally {
      setIsScanningUrl(false);
    }
  };

  const handleGeneratePositioning = async () => {
    setIsGeneratingAI(true);
    try {
      const data = await analyzeBrand({
        data: {
          name: form.name.trim() || "My Startup",
          website: form.website || "",
          industry: form.industry || "",
          audience: form.audience || "",
          offer: form.offer || "",
          tone: form.tone || "",
        },
      });

      setForm((prev) => ({
        ...prev,
        positioning: data.positioning || prev.positioning,
        industry: prev.industry || data.brand_identity || prev.industry,
        tone: prev.tone || data.tone || prev.tone,
      }));

      if (data.vibe_keywords?.length) {
        setDnaChips(data.vibe_keywords.slice(0, 6));
      }
      if (data.video_angles?.length) {
        setVideoAngles(data.video_angles);
      }
      if (data.qualifying_questions?.length) {
        setQualifyingQuestions(data.qualifying_questions);
      }
      toast.success("AI Positioning & Video Hooks generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate positioning");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddChip = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newChipInput.trim()) {
      e.preventDefault();
      const val = newChipInput.trim().toLowerCase();
      if (!dnaChips.includes(val)) {
        setDnaChips((c) => [...c, val]);
      }
      setNewChipInput("");
    }
  };

  const handleRemoveChip = (chipToRemove: string) => {
    setDnaChips((c) => c.filter((chip) => chip !== chipToRemove));
  };

  const handlePushAngleToPipeline = async (angle: string, index: number) => {
    try {
      await createContentItem({
        title: `${form.name || "Brand"} hook #${index + 1}`,
        path: "ai",
        pattern: "hook_problem_proof",
        hook: angle,
        notes: `Extracted from AI Brand Positioning on ${new Date().toLocaleDateString()}`,
        status: "ready",
      }, business.data);
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      toast.success(`Added Hook #${index + 1} to your Content Pipeline!`);
    } catch {
      toast.error("Could not add to pipeline");
    }
  };

  const copyPositioning = () => {
    if (!form.positioning) return;
    void navigator.clipboard.writeText(form.positioning);
    setCopiedPositioning(true);
    toast.success("Positioning statement copied");
    setTimeout(() => setCopiedPositioning(false), 2000);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      saveBrandProfile({
        name: form.name.trim() || "Orbit Brand",
        website: form.website.trim(),
        industry: form.industry.trim(),
        audience: form.audience.trim(),
        offer: form.offer.trim(),
        tone: form.tone.trim(),
        positioning: form.positioning.trim(),
        vibeKeywords: dnaChips,
        videoAngles: videoAngles,
        qualifyingQuestions: qualifyingQuestions,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast.success("Brand profile & positioning saved successfully!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save brand profile"),
  });

  const hasAnalysis = form.positioning.trim().length > 10 || (business.data?.positioning && business.data.positioning.length > 10);
  const isLoading = business.isLoading;

  return (
    <AppShell
      title="Brand Onboarding & Positioning"
      subtitle="Define your startup DNA, craft an undeniable positioning line, and turn it into high-converting video hooks."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePositioning}
            disabled={isGeneratingAI}
            className="border-primary/30 hover:border-primary"
          >
            {isGeneratingAI ? <Loader2 className="mr-1.5 size-4 animate-spin text-primary" /> : <Sparkles className="mr-1.5 size-4 text-primary" />}
            {isGeneratingAI ? "Generating…" : "AI Generate Positioning"}
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="shadow-md">
            {saveMutation.isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Check className="mr-1.5 size-4" />}
            Save profile
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Startup Presets Row */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/60 p-3.5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Sparkles className="size-3.5 text-primary" /> 1-Click Startup Presets:
          </span>
          {STARTUP_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePreset(preset)}
              className="text-xs font-medium rounded-full border border-border bg-secondary/70 px-3 py-1 text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Top row: intake form + AI positioning editor */}
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[0.9fr_1.1fr]">
          {/* ── Left: editable intake form ──────────────────────────── */}
          <Panel title="Startup intake" className="min-w-0">
            <div className="grid gap-4">
              <Field label="Startup name">
                <Input
                  value={form.name}
                  placeholder="e.g. Orbit, Acme AI"
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                />
              </Field>

              <Field label="Website URL (paste to auto-scan)">
                <div className="flex gap-2">
                  <Input
                    value={form.website}
                    placeholder="https://yourwebsite.com"
                    onChange={(e) => setForm((c) => ({ ...c, website: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleQuickScan();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleQuickScan}
                    disabled={isScanningUrl || !form.website.trim()}
                    className="shrink-0"
                  >
                    {isScanningUrl ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4 mr-1.5 text-primary" />}
                    {isScanningUrl ? "Scanning…" : "Scan URL"}
                  </Button>
                </div>
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Category / Industry">
                  <Input
                    value={form.industry}
                    placeholder="e.g. Developer Tools, B2B SaaS"
                    onChange={(e) => setForm((c) => ({ ...c, industry: e.target.value }))}
                  />
                </Field>
                <Field label="Brand Voice / Tone">
                  <Input
                    value={form.tone}
                    placeholder="e.g. sharp, direct, high-energy"
                    onChange={(e) => setForm((c) => ({ ...c, tone: e.target.value }))}
                  />
                </Field>
              </div>

              <Field label="Target Customer (ICP)">
                <Input
                  value={form.audience}
                  placeholder="e.g. seed founders, engineering leads, modern growth teams"
                  onChange={(e) => setForm((c) => ({ ...c, audience: e.target.value }))}
                />
              </Field>

              <Field label="Core Offer & Unfair Advantage">
                <Textarea
                  value={form.offer}
                  placeholder="What problem do you solve, and what is your tangible outcome or guarantee?"
                  onChange={(e) => setForm((c) => ({ ...c, offer: e.target.value }))}
                  className="min-h-[88px]"
                />
              </Field>

              <div className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  onClick={handleGeneratePositioning}
                  disabled={isGeneratingAI}
                  className="w-full"
                >
                  {isGeneratingAI ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
                  {isGeneratingAI ? "Analyzing & Generating Positioning…" : "Generate AI Positioning Statement"}
                </Button>
              </div>
            </div>
          </Panel>

          {/* ── Right: AI brand positioning editor ───────────────────────── */}
          <Panel
            title="AI brand positioning & intelligence"
            className="sweep min-w-0"
            action={
              <span className="flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-signal">
                <span className="size-1.5 animate-pulse rounded-full bg-signal" /> Live Engine
              </span>
            }
          >
            {isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <span className="text-sm text-muted-foreground animate-pulse">Loading brand intelligence…</span>
              </div>
            ) : hasAnalysis || form.positioning ? (
              <div className="space-y-5">
                {/* Dedicated Interactive Positioning Statement Card */}
                <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="label-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="size-3 text-primary" /> Brand Positioning Statement
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={copyPositioning}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copiedPositioning ? <Check className="size-3.5 text-signal mr-1" /> : <Copy className="size-3.5 mr-1" />}
                        {copiedPositioning ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleGeneratePositioning}
                        disabled={isGeneratingAI}
                        className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
                      >
                        {isGeneratingAI ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                        <span className="ml-1">Refine</span>
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={form.positioning}
                    onChange={(e) => setForm((c) => ({ ...c, positioning: e.target.value }))}
                    placeholder="Enter or generate your core positioning statement…"
                    className="min-h-[96px] text-base font-medium leading-relaxed bg-background/80 border-primary/20 focus-visible:ring-primary"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-signal" />
                      Clarity index: <strong className="text-foreground">Direct &amp; Outcome-Led</strong>
                    </span>
                    <span>{form.positioning.length} characters</span>
                  </div>
                </div>

                {/* Tone Presets Chips */}
                <div className="space-y-1.5">
                  <p className="label-xs text-muted-foreground">Quick tone refiners:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Bold & Direct", "Warm & Founder-Led", "Engineering-Grade", "High-Velocity", "Premium"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setForm((c) => ({ ...c, tone: t.toLowerCase() }));
                          toast.info(`Tone updated to "${t}". Click "Refine" to regenerate positioning.`);
                        }}
                        className="text-[11px] rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ICP & Offer Highlights */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
                    <p className="label-xs mb-1 text-muted-foreground">Target Buyer (ICP)</p>
                    <p className="text-sm font-medium leading-relaxed text-foreground">
                      {form.audience || "Founders & growth operators"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 shadow-sm">
                    <p className="label-xs mb-1 text-primary/80">Core Value Prop</p>
                    <p className="text-sm font-medium leading-relaxed text-foreground">
                      {form.offer ? form.offer.slice(0, 100) + (form.offer.length > 100 ? "…" : "") : "High-velocity pipeline engine"}
                    </p>
                  </div>
                </div>

                {/* DNA Chips with Add/Remove */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="label-xs">Brand DNA Keywords</p>
                    <span className="text-[10px] text-muted-foreground">Press Enter to add</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {dnaChips.map((chip) => (
                      <span
                        key={chip}
                        className="group inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-medium text-primary shadow-sm"
                      >
                        {chip}
                        <button
                          type="button"
                          onClick={() => handleRemoveChip(chip)}
                          className="text-primary/50 hover:text-destructive text-xs leading-none"
                          aria-label={`Remove ${chip}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <div className="inline-flex items-center">
                      <Input
                        value={newChipInput}
                        onChange={(e) => setNewChipInput(e.target.value)}
                        onKeyDown={handleAddChip}
                        placeholder="+ add tag…"
                        className="h-7 w-24 text-xs bg-background/50 rounded-full px-2.5"
                      />
                    </div>
                  </div>
                </div>

                <SpeedLine />
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-center p-6 border border-dashed border-border rounded-xl">
                <Sparkles className="size-8 text-primary/60 animate-pulse" />
                <h4 className="font-semibold text-foreground">Ready to analyze your brand</h4>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Paste your startup URL on the left or select a preset above, then click Generate Positioning.
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const orbitPreset = STARTUP_PRESETS[2];
                      if (orbitPreset) handlePreset(orbitPreset);
                    }}
                    variant="outline"
                  >
                    Load Orbit Demo Preset
                  </Button>
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* Bottom row: Video angles + Qualifying questions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Video angles ─────────────────────────────────────── */}
          <Panel
            title="AI short-form video hooks"
            className="min-w-0"
            action={
              <span className="text-xs text-muted-foreground">
                {videoAngles.length} hooks ready
              </span>
            }
          >
            {videoAngles.length > 0 ? (
              <div className="space-y-3">
                {videoAngles.map((angle, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <p className="text-sm font-medium leading-relaxed text-foreground">
                        “{angle}”
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePushAngleToPipeline(angle, i)}
                      className="shrink-0 text-xs gap-1.5 self-end sm:self-center"
                    >
                      <Rocket className="size-3.5 text-primary" />
                      Push to pipeline
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground italic">
                Generate brand positioning above or scan your website to see 3 high-converting video angles.
              </div>
            )}
          </Panel>

          {/* ── Qualifying questions ─────────────────────────────── */}
          <Panel
            title="Inbound DM qualifying questions"
            className="min-w-0"
            action={
              <span className="text-xs text-signal font-semibold">
                Autonomous triage
              </span>
            }
          >
            {qualifyingQuestions.length > 0 ? (
              <div className="space-y-3">
                {qualifyingQuestions.map((q, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-signal/15 font-mono text-xs font-bold text-signal">
                      Q{i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-foreground">{q}</p>
                  </div>
                ))}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80 flex items-start gap-2 mt-2">
                  <Bot className="size-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    Orbit asks these exact questions when an inbound DM arrives, scores the buyer’s budget and timeline, and routes qualified leads directly to your cockpit.
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground italic">
                Qualifying questions will appear here once your brand profile is generated.
              </div>
            )}
          </Panel>
        </div>

        {/* Analyzed-at badge */}
        {business.data?.analyzed_at && (
          <p className="text-right text-xs text-muted-foreground">
            Last analyzed &amp; synced:{" "}
            <span className="font-semibold text-foreground">
              {new Date(business.data.analyzed_at).toLocaleString()}
            </span>
          </p>
        )}
      </div>
    </AppShell>
  );
}

export function ContentPage() {
  const queryClient = useQueryClient();
  const business = useQuery({ queryKey: ["business"], queryFn: fetchBusiness });
  const content = useQuery({ queryKey: ["content-items"], queryFn: fetchContentItems });
  const shoots = useQuery({ queryKey: ["shoot-requests"], queryFn: fetchShootRequests });
  const [aiForm, setAiForm] = useState({ title: "Founder morning rush hook", pattern: "hook_problem_proof", notes: "Make the first three seconds feel urgent." });
  const [shootForm, setShootForm] = useState({ title: "Cafe workflow shoot", brief: "Capture grinding, packing, founder talking head, and customer handoff.", location: "Bengaluru", preferredDate: "" });
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const aiMutation = useMutation({
    mutationFn: () => createContentItem({ ...aiForm, path: "ai" }, business.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      toast.success("AI content draft created");
    },
    onError: () => toast.error("Could not create draft"),
  });

  const shootMutation = useMutation({
    mutationFn: () => createShootRequest(shootForm),
    onSuccess: () => {
      invalidateOrbit(queryClient);
      toast.success("Offline shoot requested");
    },
    onError: () => toast.error("Could not request shoot"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateContentItemStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      if (selectedItem?.id === updated.id) setSelectedItem(updated);
      toast.success(`Moved to ${humanize(updated.status)}`);
    },
    onError: () => toast.error("Could not update stage"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContentItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      setSelectedItem(null);
      toast.success("Content item removed");
    },
    onError: () => toast.error("Could not delete item"),
  });

  return (
    <AppShell title="Content pipeline" subtitle="Move ideas through offline production or AI generation, then into scheduling.">
      <div className="space-y-6">
        {/* ── Fastlane promo banner ─────────────────────────────────── */}
        <a
          href="https://app.usefastlane.ai/onboarding"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between gap-4 rounded-xl border border-primary/25 bg-primary/5 px-5 py-3.5 shadow-sm transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Clapperboard className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">
                Make your own post &amp; schedule
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create and publish content directly via Fastlane
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            Open Fastlane
            <ArrowRight className="size-3" />
          </span>
        </a>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Panel title="Pipeline board" bodyClassName="p-3 overflow-hidden">
            <div className="flex items-start gap-3 overflow-x-auto pb-4 snap-x xl:grid xl:grid-cols-5 xl:items-stretch xl:overflow-visible xl:pb-0 xl:snap-none">
              {CONTENT_STAGES.map((stage) => {
                const items = (content.data ?? []).filter((item) => item.status === stage.key);
                return (
                  <div key={stage.key} className="min-h-44 w-[240px] shrink-0 snap-start rounded-md border border-border bg-background/60 p-3 sm:min-h-72 sm:w-[280px] xl:w-auto">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="label-xs">{stage.label}</p>
                      <span className="num text-xs text-muted-foreground">{items.length}</span>
                    </div>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="rounded-lg border border-border bg-card p-3 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Chip className="capitalize">{item.path}</Chip>
                            {item.path === "ai" ? <Bot className="size-4 text-cool" /> : <Clapperboard className="size-4 text-heat" />}
                          </div>
                          <h3 className="mt-2.5 text-sm font-semibold leading-tight text-foreground">{item.title}</h3>
                          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{item.hook ?? item.notes ?? item.caption}</p>
                          <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
                            <span>{item.pattern ? humanize(item.pattern) : "Standard"}</span>
                            <span className="font-semibold text-primary">View details →</span>
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div className="py-6 text-center text-xs text-muted-foreground/60 italic">
                          Empty
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title="AI-generated path">
              <div className="space-y-4">
                <Field label="Video title">
                  <Input value={aiForm.title} onChange={(event) => setAiForm((current) => ({ ...current, title: event.target.value }))} />
                </Field>
                <Field label="Viral pattern">
                  <Select value={aiForm.pattern} onValueChange={(value) => setAiForm((current) => ({ ...current, pattern: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VIRAL_PATTERNS.map((pattern) => <SelectItem key={pattern.key} value={pattern.key}>{pattern.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Creative brief">
                  <Textarea value={aiForm.notes} onChange={(event) => setAiForm((current) => ({ ...current, notes: event.target.value }))} />
                </Field>
                <Button className="w-full" onClick={() => aiMutation.mutate()} disabled={aiMutation.isPending}><Sparkles className="size-4 mr-2" /> Generate ready draft</Button>
              </div>
            </Panel>

            <Panel title="Offline shoot path">
              <div className="space-y-4">
                <Field label="Shoot title">
                  <Input value={shootForm.title} onChange={(event) => setShootForm((current) => ({ ...current, title: event.target.value }))} />
                </Field>
                <Field label="Brief">
                  <Textarea value={shootForm.brief} onChange={(event) => setShootForm((current) => ({ ...current, brief: event.target.value }))} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Location"><Input value={shootForm.location} onChange={(event) => setShootForm((current) => ({ ...current, location: event.target.value }))} /></Field>
                  <Field label="Date"><Input type="date" value={shootForm.preferredDate} onChange={(event) => setShootForm((current) => ({ ...current, preferredDate: event.target.value }))} /></Field>
                </div>
                <Button variant="secondary" className="w-full" onClick={() => shootMutation.mutate()} disabled={shootMutation.isPending}><Clapperboard className="size-4 mr-2" /> Request VasuDev MarketX</Button>
              </div>
            </Panel>
          </div>
        </div>

        <Panel title="Shoot status trail">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(shoots.data ?? []).map((shoot) => (
              <div key={shoot.id} className="rounded-md border border-border bg-secondary/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{shoot.partner}</p>
                  <StatusPill status={shoot.status} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{shoot.brief}</p>
                <div className="mt-4 grid grid-cols-5 gap-1">
                  {SHOOT_TRAIL.map((step) => (
                    <div key={step} className={cn("h-1 rounded-full bg-muted", SHOOT_TRAIL.indexOf(step) <= SHOOT_TRAIL.indexOf(shoot.status as never) && "bg-signal")} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Content Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Chip className="capitalize">{selectedItem?.path}</Chip>
              <StatusPill status={selectedItem?.status ?? "idea"} />
            </div>
            <DialogTitle className="text-xl font-bold">{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              Pattern: {selectedItem?.pattern ? humanize(selectedItem.pattern) : "General short video"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedItem?.hook && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5">
                <p className="label-xs text-primary mb-1">First 3-Second Hook</p>
                <p className="text-sm font-semibold text-foreground leading-relaxed">
                  “{selectedItem.hook}”
                </p>
              </div>
            )}

            {selectedItem?.script && (
              <div className="rounded-lg border border-border bg-card p-3.5 space-y-1">
                <p className="label-xs text-muted-foreground mb-1.5">Beat-by-Beat Script</p>
                <p className="text-xs leading-relaxed font-mono whitespace-pre-wrap text-foreground/90">
                  {selectedItem.script}
                </p>
              </div>
            )}

            {selectedItem?.caption && (
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="label-xs text-muted-foreground mb-1">Platform Caption</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {selectedItem.caption}
                </p>
              </div>
            )}

            {selectedItem?.hashtags && selectedItem.hashtags.length > 0 && (
              <div>
                <p className="label-xs text-muted-foreground mb-1.5">Hashtags</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedItem.hashtags.map((tag) => (
                    <span key={tag} className="text-[11px] rounded bg-secondary px-2 py-0.5 text-muted-foreground">
                      {tag.startsWith("#") ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stage Selector */}
            <div className="border-t border-border pt-4">
              <p className="label-xs mb-2">Advance Stage</p>
              <div className="flex flex-wrap gap-1.5">
                {CONTENT_STAGES.map((s) => (
                  <Button
                    key={s.key}
                    size="sm"
                    variant={selectedItem?.status === s.key ? "default" : "outline"}
                    className="text-xs h-8"
                    disabled={updateStatusMutation.isPending || selectedItem?.status === s.key}
                    onClick={() => selectedItem && updateStatusMutation.mutate({ id: selectedItem.id, status: s.key })}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => selectedItem && deleteMutation.mutate(selectedItem.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="size-3.5 mr-1" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="secondary">
                <a href="/distribution">Schedule boost →</a>
              </Button>
              <Button size="sm" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthGrid(month: Date) {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    days.push(new Date(first.getFullYear(), first.getMonth(), 1 - offset + i));
  }
  return days;
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function rupees(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function DistributionPage() {
  const queryClient = useQueryClient();
  const content = useQuery({ queryKey: ["content-items"], queryFn: fetchContentItems });
  const schedules = useQuery({ queryKey: ["schedules"], queryFn: fetchSchedules });
  const readyContent = (content.data ?? []).filter((item) => item.status === "ready" || item.status === "scheduled");
  const allSchedules = schedules.data ?? [];

  const [platformFilter, setPlatformFilter] = useState("all");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [form, setForm] = useState(() => ({
    contentItemId: "",
    platform: "instagram",
    publishAt: toLocalInputValue(suggestedSlot("instagram")),
    adBudget: 3500,
    audienceNotes: "Founders in Bengaluru, Mumbai, Delhi. Retarget warm engagers first.",
  }));

  const visible = useMemo(
    () => allSchedules.filter((item) => platformFilter === "all" || item.platform === platformFilter),
    [allSchedules, platformFilter],
  );

  const totals = useMemo(() => {
    const queued = allSchedules.filter((item) => item.status === "scheduled");
    const spend = allSchedules.reduce((sum, item) => sum + safeNumber(item.ad_budget), 0);
    const projected = allSchedules.reduce((sum, item) => sum + estimateReach(safeNumber(item.ad_budget), item.platform).leads, 0);
    return {
      queued: queued.length,
      published: allSchedules.filter((item) => item.status === "published").length,
      spend,
      projected,
    };
  }, [allSchedules]);

  const projection = estimateReach(form.adBudget, form.platform);

  const scheduleMutation = useMutation({
    mutationFn: () => {
      if (!form.publishAt) throw new Error("Pick a publish time first.");
      if (new Date(form.publishAt).getTime() < Date.now() - 60_000) throw new Error("Publish time is in the past.");
      if (form.adBudget < 500) throw new Error("Boost budget must be at least ₹500.");
      return createSchedule({ ...form, publishAt: new Date(form.publishAt).toISOString() });
    },
    onSuccess: (created) => {
      invalidateOrbit(queryClient);
      setMonth(startOfMonth(new Date(created.publish_at)));
      toast.success(`${channelLabel(created.platform)} post queued for ${formatDateTime(created.publish_at)}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not schedule video"),
  });

  const publishMutation = useMutation({
    mutationFn: (schedule: Schedule) => publishSchedule(schedule),
    onSuccess: () => {
      invalidateOrbit(queryClient);
      toast.success("Post marked live");
    },
    onError: () => toast.error("Could not publish that post"),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateSchedule>[1] }) => updateSchedule(id, patch),
    onSuccess: () => {
      invalidateOrbit(queryClient);
      toast.success("Schedule updated");
    },
    onError: () => toast.error("Could not update that post"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      invalidateOrbit(queryClient);
      toast.success("Removed from the calendar");
    },
    onError: () => toast.error("Could not remove that post"),
  });

  const dueMutation = useMutation({
    mutationFn: () => publishDueSchedules(allSchedules),
    onSuccess: (count) => {
      invalidateOrbit(queryClient);
      toast.success(count ? `${count} post${count > 1 ? "s" : ""} went live` : "Nothing was due yet");
    },
    onError: () => toast.error("Could not run due posts"),
  });

  const days = monthGrid(month);
  const dayList = selectedDay
    ? visible.filter((item) => sameDay(new Date(item.publish_at), selectedDay))
    : visible;
  const contentTitle = (id: string | null) =>
    (content.data ?? []).find((item) => item.id === id)?.title ?? "Unlinked video";

  return (
    <AppShell
      title="Distribution"
      subtitle="Plan the post, set the boost, watch the projected leads — then push it live."
      actions={
        <Button variant="secondary" onClick={() => dueMutation.mutate()} disabled={dueMutation.isPending}>
          <Radio className="size-4" /> Run due posts
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile label="Queued" value={totals.queued} tone="heat" hint="Waiting on their slot" />
          <StatTile label="Published" value={totals.published} tone="signal" hint="Already live" />
          <StatTile label="Boost spend" value={rupees(totals.spend)} hint="Across the calendar" />
          <StatTile label="Projected leads" value={totals.projected} tone="cool" hint="From current budgets" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Panel title="Schedule a video">
            <div className="space-y-4">
              <Field label="Ready content">
                <Select value={form.contentItemId || "none"} onValueChange={(value) => setForm((current) => ({ ...current, contentItemId: value === "none" ? "" : value }))}>
                  <SelectTrigger><SelectValue placeholder="Pick video" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No content link</SelectItem>
                    {readyContent.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Platform">
                  <Select
                    value={form.platform}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        platform: value,
                        publishAt: toLocalInputValue(suggestedSlot(value)),
                      }))
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Boost budget (₹)">
                  <Input type="number" min={500} step={500} value={form.adBudget} onChange={(event) => setForm((current) => ({ ...current, adBudget: Number(event.target.value) }))} />
                </Field>
              </div>
              <Field label="Publish time">
                <Input type="datetime-local" value={form.publishAt} onChange={(event) => setForm((current) => ({ ...current, publishAt: event.target.value }))} />
              </Field>
              <button
                type="button"
                className="text-xs font-semibold text-signal underline-offset-4 hover:underline"
                onClick={() => setForm((current) => ({ ...current, publishAt: toLocalInputValue(suggestedSlot(current.platform)) }))}
              >
                Use best time for {channelLabel(form.platform)}
              </button>
              <Field label="Audience notes">
                <Textarea value={form.audienceNotes} onChange={(event) => setForm((current) => ({ ...current, audienceNotes: event.target.value }))} />
              </Field>
              <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-secondary/40 p-3 text-center">
                {[
                  { label: "Reach", value: projection.reach.toLocaleString("en-IN") },
                  { label: "Clicks", value: projection.clicks.toLocaleString("en-IN") },
                  { label: "Leads", value: projection.leads.toLocaleString("en-IN") },
                ].map((cell) => (
                  <div key={cell.label}>
                    <p className="label-xs">{cell.label}</p>
                    <p className="num mt-1 text-lg font-semibold">{cell.value}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={() => scheduleMutation.mutate()} disabled={scheduleMutation.isPending}>
                <CalendarClock className="size-4" /> Schedule boost
              </Button>
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel
              title={new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(month)}
              action={
                <div className="flex items-center gap-2">
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="h-8 w-[112px] sm:w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All platforms</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>←</Button>
                  <Button variant="ghost" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>→</Button>
                </div>
              }
            >
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                  <p key={day} className="label-xs pb-1 text-center">{day}</p>
                ))}
                {days.map((day) => {
                  const items = visible.filter((item) => sameDay(new Date(item.publish_at), day));
                  const inMonth = day.getMonth() === month.getMonth();
                  const isSelected = selectedDay ? sameDay(day, selectedDay) : false;
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => {
                        setSelectedDay(isSelected ? null : day);
                        const slot = suggestedSlot(form.platform, new Date());
                        const target = new Date(day);
                        target.setHours(slot.getHours(), slot.getMinutes(), 0, 0);
                        setForm((current) => ({ ...current, publishAt: toLocalInputValue(target) }));
                      }}
                      className={cn(
                        "min-h-14 rounded-md border border-border/60 p-1 text-left sm:min-h-16 sm:p-1.5 transition-colors hover:border-signal/50",
                        !inMonth && "opacity-40",
                        isSelected && "border-signal bg-signal/10",
                      )}
                    >
                      <span className="num text-xs text-muted-foreground">{day.getDate()}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {items.slice(0, 3).map((item) => (
                          <span
                            key={item.id}
                            className={cn(
                              "size-1.5 rounded-full",
                              item.status === "published" ? "bg-signal" : "bg-heat",
                            )}
                          />
                        ))}
                        {items.length > 3 ? <span className="num text-[10px] text-muted-foreground">+{items.length - 3}</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel
              title={selectedDay ? `Posts on ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(selectedDay)}` : "Launch queue"}
              action={selectedDay ? <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>Show all</Button> : null}
              bodyClassName="space-y-3"
            >
              {dayList.length === 0 ? (
                <EmptyState title="Nothing scheduled here" hint="Pick a ready video, set a time, and queue the boost." />
              ) : (
                dayList.map((schedule) => {
                  const projected = estimateReach(safeNumber(schedule.ad_budget), schedule.platform);
                  return (
                    <div key={schedule.id} className="rounded-md border border-border bg-secondary/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="label-xs">{channelLabel(schedule.platform)}</p>
                          <p className="truncate font-semibold">{contentTitle(schedule.content_item_id)}</p>
                        </div>
                        <StatusPill status={schedule.status} />
                      </div>
                      <p className="num mt-2 text-xl font-semibold">{formatDateTime(schedule.publish_at)}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{schedule.audience_notes}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                        <span className="flex items-center gap-1.5 text-heat"><CircleDollarSign className="size-4" /> {rupees(safeNumber(schedule.ad_budget))}</span>
                        <span className="text-muted-foreground">≈ {projected.reach.toLocaleString("en-IN")} reach</span>
                        <span className="text-muted-foreground">≈ {projected.leads} leads</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {schedule.status !== "published" ? (
                          <Button size="sm" onClick={() => publishMutation.mutate(schedule)} disabled={publishMutation.isPending}>
                            <Radio className="size-4" /> Publish now
                          </Button>
                        ) : null}
                        {schedule.status === "scheduled" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              const next = new Date(schedule.publish_at);
                              next.setDate(next.getDate() + 1);
                              patchMutation.mutate({ id: schedule.id, patch: { publishAt: next.toISOString() } });
                            }}
                            disabled={patchMutation.isPending}
                          >
                            <Timer className="size-4" /> Push +1 day
                          </Button>
                        ) : null}
                        {schedule.status === "scheduled" ? (
                          <Button size="sm" variant="outline" onClick={() => patchMutation.mutate({ id: schedule.id, patch: { status: "paused" } })} disabled={patchMutation.isPending}>
                            Pause
                          </Button>
                        ) : null}
                        {schedule.status === "paused" ? (
                          <Button size="sm" variant="outline" onClick={() => patchMutation.mutate({ id: schedule.id, patch: { status: "scheduled" } })} disabled={patchMutation.isPending}>
                            Resume
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" onClick={() => removeMutation.mutate(schedule.id)} disabled={removeMutation.isPending}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}


export function LeadsPage() {
  const leadsQuery = useQuery({ queryKey: ["leads"], queryFn: fetchLeads });
  const queryClient = useQueryClient();
  const leads = useMemo(() => [...(leadsQuery.data ?? [])].sort((a, b) => tierRank(a.tier) - tierRank(b.tier)), [leadsQuery.data]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const selectedLead = leads.find((lead) => lead.id === (selectedId ?? leads[0]?.id));
  const [form, setForm] = useState({ name: "Aarav Mehta", handle: "@aarav.ops", channel: "whatsapp", message: "Need 20 onboarding videos this month. Can you handle scripting, shoot, ads, and qualify inbound replies?", tier: "auto", score: 91 });
  const leadMutation = useMutation({
    mutationFn: () => simulateLead(form),
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSelectedId(lead.id);
      toast.success("Inbound lead simulated");
    },
    onError: () => toast.error("Could not simulate lead"),
  });
  const stats = leadStats(leads);

  return (
    <AppShell title="Lead qualification" subtitle="Every inbound DM gets an instant reply, score, reason, and founder-ready tier.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile label="Open threads" value={stats.open} tone="cool" />
          <StatTile label="High value" value={stats.high} tone="signal" />
          <StatTile label="Won" value={stats.won} tone="heat" />
          <StatTile label="Avg score" value={stats.averageScore} unit="/100" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <Panel title="Inbox stack" bodyClassName="space-y-2">
            {leads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} selected={lead.id === selectedLead?.id} onSelect={() => setSelectedId(lead.id)} />
            ))}
          </Panel>

          <Panel title="Conversation cockpit" bodyClassName="p-0">
            <LeadThread lead={selectedLead} />
          </Panel>
        </div>

        <Panel title="Simulate inbound lead">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.5fr_auto] lg:gap-4">
            <Field label="Name"><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field>
            <Field label="Handle"><Input value={form.handle} onChange={(event) => setForm((current) => ({ ...current, handle: event.target.value }))} /></Field>
            <Field label="Score"><Input type="number" min={1} max={100} value={form.score} onChange={(event) => setForm((current) => ({ ...current, score: Number(event.target.value) }))} /></Field>
            <div className="self-end"><Button onClick={() => leadMutation.mutate()} disabled={leadMutation.isPending} className="w-full"><Zap className="size-4" /> Score</Button></div>
            <div className="lg:col-span-4">
              <Field label="Message"><Textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} /></Field>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const business = useQuery({ queryKey: ["business"], queryFn: fetchBusiness });
  const [replyTone, setReplyTone] = useState(business.data?.auto_reply_tone ?? "fast, friendly, founder-direct");
  const [template, setTemplate] = useState(business.data?.auto_reply_template ?? "Thanks for reaching out — I can help. What launch timeline, budget band, and expected lead volume should I plan around?");

  useEffect(() => {
    if (business.data?.auto_reply_tone) setReplyTone(business.data.auto_reply_tone);
    if (business.data?.auto_reply_template) setTemplate(business.data.auto_reply_template);
  }, [business.data]);

  const saveMutation = useMutation({
    mutationFn: async () => saveBrandProfile({
      name: business.data?.name ?? "Orbit Demo",
      website: business.data?.website ?? "",
      industry: business.data?.industry ?? "",
      audience: business.data?.audience ?? "",
      offer: business.data?.offer ?? "",
      tone: business.data?.tone ?? "direct",
      positioning: business.data?.positioning ?? "",
      autoReplyTone: replyTone,
      autoReplyTemplate: template,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast.success("Settings & operating rules saved");
    },
    onError: () => toast.error("Could not save settings"),
  });

  const toggleChannelMutation = useMutation({
    mutationFn: (patch: { instagram?: boolean; facebook?: boolean; whatsapp?: boolean }) =>
      updateBusinessChannels(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast.success("Channel connection updated");
    },
    onError: () => toast.error("Could not update channel"),
  });

  return (
    <AppShell title="Settings" subtitle="Business profile, channel status, and auto-reply operating rules.">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Connected channels">
          <div className="grid gap-3">
            {[
              {
                id: "instagram" as const,
                label: "Instagram DM",
                active: business.data?.instagram_connected,
                icon: Inbox,
              },
              {
                id: "whatsapp" as const,
                label: "WhatsApp",
                active: business.data?.whatsapp_connected,
                icon: MessageCircle,
              },
              {
                id: "facebook" as const,
                label: "Facebook Messenger",
                active: business.data?.facebook_connected,
                icon: Megaphone,
              },
            ].map((channel) => (
              <div key={channel.label} className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-sm bg-primary/15 text-primary"><channel.icon className="size-4" /></span>
                  <div>
                    <p className="font-semibold">{channel.label}</p>
                    <p className="text-xs text-muted-foreground">{channel.active ? "Connection live & active" : "Manual demo mode"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={channel.active ? "live" : "demo"} />
                  <Button
                    size="sm"
                    variant={channel.active ? "outline" : "secondary"}
                    className="text-xs h-7 px-2.5"
                    disabled={toggleChannelMutation.isPending}
                    onClick={() => toggleChannelMutation.mutate({ [channel.id]: !channel.active })}
                  >
                    {channel.active ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Auto-reply control">
          <div className="space-y-4">
            <Field label="Reply tone"><Input value={replyTone} onChange={(event) => setReplyTone(event.target.value)} /></Field>
            <Field label="Template"><Textarea value={template} onChange={(event) => setTemplate(event.target.value)} className="min-h-32 font-mono text-xs leading-relaxed" /></Field>
            <div className="rounded-md border border-border bg-secondary/40 p-4">
              <p className="label-xs">Founder handoff rule</p>
              <p className="mt-2 text-sm text-muted-foreground">High-tier leads go straight to the founder queue. Medium-tier leads receive two more qualifying questions. Low-tier leads stay automated unless they re-engage.</p>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Settings2 className="size-4 mr-2" /> Save operating rules</Button>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

export function HomePreviewStats() {
  const { content, schedules, leads } = useOrbitData();
  const stats = leadStats(leads.data ?? []);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <MiniMetric icon={Activity} label="Campaign assets" value={`${content.data?.length ?? 0} live`} />
      <MiniMetric icon={Timer} label="Scheduled boosts" value={`${schedules.data?.length ?? 0} queued`} />
      <MiniMetric icon={Flame} label="Hot leads" value={`${stats.high} active`} />
    </div>
  );
}

export { Activity, ArrowRight, Bot, CalendarClock, CheckCircle2, Flame, Gauge, Inbox, Megaphone, Radio, Rocket, Sparkles, Target, Timer, Zap };
