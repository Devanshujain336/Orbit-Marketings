import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clapperboard,
  Flame,
  Gauge,
  Inbox,
  Megaphone,
  MessageCircle,
  Radio,
  Rocket,
  Settings2,
  Sparkles,
  Target,
  Timer,
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
} from "@/lib/orbit";
import { cn } from "@/lib/utils";

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
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead status updated");
    },
    onError: () => toast.error("Could not update lead"),
  });

  if (!lead) {
    return <EmptyState title="No lead selected" hint="Pick a conversation from the stack." />;
  }

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

      <div className="flex-1 space-y-3 p-4">
        {(messages.data ?? []).map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[82%] rounded-md border border-border p-3 text-sm",
              message.direction === "outbound" ? "ml-auto bg-primary/15" : "bg-secondary/70",
            )}
          >
            <p>{message.body}</p>
            <p className="label-xs mt-2">{message.automated ? "Auto reply" : humanize(message.direction)}</p>
          </div>
        ))}
        {messages.isLoading ? <p className="text-sm text-muted-foreground">Loading thread…</p> : null}
      </div>

      <div className="border-t border-border p-4">
        <Textarea
          readOnly
          value="Thanks — this looks like a strong fit. I can send pricing and open slots, or route this to the founder now."
          className="min-h-20 bg-secondary/40"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => statusMutation.mutate({ id: lead.id, status: "won" })} disabled={statusMutation.isPending}>
            <Trophy className="size-4" /> Mark won
          </Button>
          <Button variant="secondary" onClick={() => statusMutation.mutate({ id: lead.id, status: "qualified" })} disabled={statusMutation.isPending}>
            <CheckCircle2 className="size-4" /> Qualify
          </Button>
          <Button variant="outline" onClick={() => statusMutation.mutate({ id: lead.id, status: "lost" })} disabled={statusMutation.isPending}>
            Close out
          </Button>
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
        <div className="grid gap-3 sm:grid-cols-3">
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

export function OnboardingPage() {
  const queryClient = useQueryClient();
  const business = useQuery({ queryKey: ["business"], queryFn: fetchBusiness });
  const [form, setForm] = useState({
    name: "Kettle & Co.",
    website: "https://kettle.example",
    industry: "Specialty coffee subscription",
    audience: "urban founders and operators",
    offer: "fresh roasted coffee subscriptions for busy teams",
    tone: "sharp, warm, premium",
  });

  useEffect(() => {
    if (business.data) {
      setForm({
        name: business.data.name ?? "",
        website: business.data.website ?? "",
        industry: business.data.industry ?? "",
        audience: business.data.audience ?? "",
        offer: business.data.offer ?? "",
        tone: business.data.tone ?? "",
      });
    }
  }, [business.data]);
  const saveMutation = useMutation({
    mutationFn: () => saveBrandProfile(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast.success("Brand analysis saved");
    },
    onError: () => toast.error("Could not save brand profile"),
  });

  return (
    <AppShell
      title="Onboarding"
      subtitle="Feed Orbit the startup surface area, then lock the creative and reply direction."
      actions={<Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Sparkles className="size-4" /> Analyze</Button>}
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Startup intake">
          <div className="grid gap-4">
            <Field label="Business name">
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </Field>
            <Field label="Website">
              <Input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Industry">
                <Input value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))} />
              </Field>
              <Field label="Tone">
                <Input value={form.tone} onChange={(event) => setForm((current) => ({ ...current, tone: event.target.value }))} />
              </Field>
            </div>
            <Field label="Audience">
              <Input value={form.audience} onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))} />
            </Field>
            <Field label="Offer">
              <Textarea value={form.offer} onChange={(event) => setForm((current) => ({ ...current, offer: event.target.value }))} className="min-h-24" />
            </Field>
          </div>
        </Panel>

        <Panel title="Analysis result" className="sweep">
          <div className="space-y-6">
            <div>
              <p className="label-xs">Positioning line</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight">{business.data?.positioning ?? `${form.name} converts attention into qualified demand before founders enter the chat.`}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border bg-asphalt p-4">
                <p className="label-xs">Base</p>
                <p className="mt-2 text-sm font-medium">Asphalt / carbon</p>
              </div>
              <div className="rounded-md border border-signal/40 bg-signal/15 p-4 text-signal">
                <p className="label-xs text-signal/80">Signal</p>
                <p className="mt-2 text-sm font-medium">Electric lime</p>
              </div>
              <div className="rounded-md border border-heat/40 bg-heat/15 p-4 text-heat">
                <p className="label-xs text-heat/80">Boost</p>
                <p className="mt-2 text-sm font-medium">Amber urgency</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(business.data?.vibe_keywords ?? [form.industry, form.tone, "premium leads", "instant replies"]).filter(Boolean).map((item) => (
                <Chip key={item}>{item}</Chip>
              ))}
            </div>
            <SpeedLine />
            <p className="text-sm text-muted-foreground">Saved profiles feed the content generator, media scheduling notes, and lead auto-reply voice across the workspace.</p>
          </div>
        </Panel>
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

  return (
    <AppShell title="Content pipeline" subtitle="Move ideas through offline production or AI generation, then into scheduling.">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Panel title="Pipeline board" bodyClassName="p-3">
            <div className="grid gap-3 xl:grid-cols-5">
              {CONTENT_STAGES.map((stage) => {
                const items = (content.data ?? []).filter((item) => item.status === stage.key);
                return (
                  <div key={stage.key} className="min-h-72 rounded-md border border-border bg-background/60 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="label-xs">{stage.label}</p>
                      <span className="num text-xs text-muted-foreground">{items.length}</span>
                    </div>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="rounded-sm border border-border bg-card p-3">
                          <div className="flex items-center justify-between gap-2">
                            <Chip className="capitalize">{item.path}</Chip>
                            {item.path === "ai" ? <Bot className="size-4 text-cool" /> : <Clapperboard className="size-4 text-heat" />}
                          </div>
                          <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.hook ?? item.notes ?? item.caption}</p>
                        </div>
                      ))}
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
                <Button className="w-full" onClick={() => aiMutation.mutate()} disabled={aiMutation.isPending}><Sparkles className="size-4" /> Generate ready draft</Button>
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
                <Button variant="secondary" className="w-full" onClick={() => shootMutation.mutate()} disabled={shootMutation.isPending}><Clapperboard className="size-4" /> Request VasuDev MarketX</Button>
              </div>
            </Panel>
          </div>
        </div>

        <Panel title="Shoot status trail">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
    </AppShell>
  );
}

export function DistributionPage() {
  const queryClient = useQueryClient();
  const content = useQuery({ queryKey: ["content-items"], queryFn: fetchContentItems });
  const schedules = useQuery({ queryKey: ["schedules"], queryFn: fetchSchedules });
  const readyContent = (content.data ?? []).filter((item) => item.status === "ready" || item.status === "scheduled");
  const [form, setForm] = useState({ contentItemId: "", platform: "instagram", publishAt: "", adBudget: 3500, audienceNotes: "Founders in Bengaluru, Mumbai, Delhi. Retarget warm engagers first." });
  const scheduleMutation = useMutation({
    mutationFn: () => createSchedule(form),
    onSuccess: () => {
      invalidateOrbit(queryClient);
      toast.success("Video scheduled");
    },
    onError: () => toast.error("Could not schedule video"),
  });

  return (
    <AppShell title="Distribution" subtitle="Calendar-ready publishing and boost planning for Instagram and Facebook.">
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
                <Select value={form.platform} onValueChange={(value) => setForm((current) => ({ ...current, platform: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Boost budget">
                <Input type="number" value={form.adBudget} onChange={(event) => setForm((current) => ({ ...current, adBudget: Number(event.target.value) }))} />
              </Field>
            </div>
            <Field label="Publish time">
              <Input type="datetime-local" value={form.publishAt} onChange={(event) => setForm((current) => ({ ...current, publishAt: event.target.value }))} />
            </Field>
            <Field label="Audience notes">
              <Textarea value={form.audienceNotes} onChange={(event) => setForm((current) => ({ ...current, audienceNotes: event.target.value }))} />
            </Field>
            <Button className="w-full" onClick={() => scheduleMutation.mutate()} disabled={scheduleMutation.isPending}><CalendarClock className="size-4" /> Schedule boost</Button>
          </div>
        </Panel>

        <Panel title="Launch calendar">
          <div className="grid gap-3 md:grid-cols-2">
            {(schedules.data ?? []).map((schedule) => (
              <div key={schedule.id} className="rounded-md border border-border bg-secondary/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="label-xs">{channelLabel(schedule.platform)}</p>
                  <StatusPill status={schedule.status} />
                </div>
                <p className="num mt-3 text-2xl font-semibold">{formatDateTime(schedule.publish_at)}</p>
                <p className="mt-2 text-sm text-muted-foreground">{schedule.audience_notes}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-heat">
                  <CircleDollarSign className="size-4" /> ₹{schedule.ad_budget.toLocaleString("en-IN")} boost
                </div>
              </div>
            ))}
          </div>
        </Panel>
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.5fr_auto]">
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
  const saveMutation = useMutation({
    mutationFn: async () => saveBrandProfile({
      name: business.data?.name ?? "Orbit Demo",
      website: business.data?.website ?? "",
      industry: business.data?.industry ?? "",
      audience: business.data?.audience ?? "",
      offer: business.data?.offer ?? "",
      tone: replyTone,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Could not save settings"),
  });

  return (
    <AppShell title="Settings" subtitle="Business profile, channel status, and auto-reply operating rules.">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Connected channels">
          <div className="grid gap-3">
            {[
              { label: "Instagram DM", active: business.data?.instagram_connected, icon: Inbox },
              { label: "WhatsApp", active: business.data?.whatsapp_connected, icon: MessageCircle },
              { label: "Facebook", active: business.data?.facebook_connected, icon: Megaphone },
            ].map((channel) => (
              <div key={channel.label} className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-sm bg-primary/15 text-primary"><channel.icon className="size-4" /></span>
                  <div>
                    <p className="font-semibold">{channel.label}</p>
                    <p className="text-xs text-muted-foreground">{channel.active ? "Connection healthy" : "Manual demo mode"}</p>
                  </div>
                </div>
                <StatusPill status={channel.active ? "live" : "demo"} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Auto-reply control">
          <div className="space-y-4">
            <Field label="Reply tone"><Input value={replyTone} onChange={(event) => setReplyTone(event.target.value)} /></Field>
            <Field label="Template"><Textarea value={template} onChange={(event) => setTemplate(event.target.value)} className="min-h-32" /></Field>
            <div className="rounded-md border border-border bg-secondary/40 p-4">
              <p className="label-xs">Founder handoff rule</p>
              <p className="mt-2 text-sm text-muted-foreground">High-tier leads go straight to the founder queue. Medium-tier leads receive two more qualifying questions. Low-tier leads stay automated unless they re-engage.</p>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Settings2 className="size-4" /> Save operating rules</Button>
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
    <div className="grid gap-3 sm:grid-cols-3">
      <MiniMetric icon={Activity} label="Campaign assets" value={`${content.data?.length ?? 0} live`} />
      <MiniMetric icon={Timer} label="Scheduled boosts" value={`${schedules.data?.length ?? 0} queued`} />
      <MiniMetric icon={Flame} label="Hot leads" value={`${stats.high} active`} />
    </div>
  );
}

export { Activity, ArrowRight, Bot, CalendarClock, CheckCircle2, Flame, Gauge, Inbox, Megaphone, Radio, Rocket, Sparkles, Target, Timer, Zap };
