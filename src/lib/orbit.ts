import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const DEMO_BUSINESS_ID = "11111111-1111-1111-1111-111111111111";

export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type ContentItem = Database["public"]["Tables"]["content_items"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadMessage = Database["public"]["Tables"]["lead_messages"]["Row"];
export type Schedule = Database["public"]["Tables"]["schedules"]["Row"];
export type ShootRequest = Database["public"]["Tables"]["shoot_requests"]["Row"];

export const CONTENT_STAGES = [
  { key: "idea", label: "Idea" },
  { key: "in_production", label: "In production" },
  { key: "ready", label: "Ready" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
] as const;

export const SHOOT_TRAIL = ["requested", "scheduled", "filmed", "edited", "delivered"] as const;

export const VIRAL_PATTERNS = [
  { key: "hook_problem_proof", label: "Problem → Proof", note: "Cold-open pain, fast proof, single CTA" },
  { key: "pov_day", label: "POV day-in-the-life", note: "Handheld, ambient sound, no script feel" },
  { key: "listicle_snap", label: "3-snap listicle", note: "Hard cuts every 1.2s, on-screen text" },
  { key: "myth_bust", label: "Myth vs reality", note: "Split screen, contrarian hook" },
  { key: "before_after", label: "Before / after", note: "Transformation reveal at 0:04" },
] as const;

export type BrandProfileInput = {
  name: string;
  website?: string;
  industry?: string;
  audience?: string;
  offer?: string;
  tone?: string;
};

export type CreateContentInput = {
  title: string;
  path: "ai" | "offline";
  pattern?: string;
  notes?: string;
};

export type CreateShootInput = {
  title: string;
  brief: string;
  location: string;
  preferredDate: string;
};

export type CreateScheduleInput = {
  contentItemId?: string;
  platform: string;
  publishAt: string;
  adBudget: number;
  audienceNotes: string;
};

export type SimulatedLeadInput = {
  name: string;
  handle: string;
  channel: string;
  message: string;
  tier: string;
  score: number;
};

export function humanize(value: string) {
  return value.replace(/_/g, " ");
}

export function tierRank(tier: string) {
  return tier === "high" ? 0 : tier === "medium" ? 1 : 2;
}

export function formatDateTime(value: string | null) {
  if (!value) return "TBD";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function scoreToTier(score: number) {
  if (score >= 78) return "high";
  if (score >= 52) return "medium";
  return "low";
}

function generatedDraft(title: string, pattern?: string, business?: Business | null) {
  const brandName = business?.name ?? "the brand";
  const audience = business?.audience ?? "busy buyers";
  const offer = business?.offer ?? "the core offer";
  const patternLabel = VIRAL_PATTERNS.find((item) => item.key === pattern)?.label ?? "fast hook";

  return {
    hook: `${audience} are losing hours before they even compare options.`,
    script: `0:00 Open on the daily friction. 0:03 Show ${brandName} removing it with ${offer}. 0:07 Cut to proof, customer moment, and simple next step. 0:12 Close with a direct DM prompt shaped around ${patternLabel}.`,
    caption: `${brandName} turns the slowest buying moment into a fast, confident decision. DM us to see the workflow in action.`,
    hashtags: ["#founderops", "#growthengine", "#leadflow", "#orbit"],
    title,
  };
}

export async function fetchBusiness() {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", DEMO_BUSINESS_ID)
    .maybeSingle();
  if (error) throw error;
  return data as Business | null;
}

export async function fetchContentItems() {
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("business_id", DEMO_BUSINESS_ID)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContentItem[];
}

export async function fetchShootRequests() {
  const { data, error } = await supabase
    .from("shoot_requests")
    .select("*")
    .eq("business_id", DEMO_BUSINESS_ID)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ShootRequest[];
}

export async function fetchSchedules() {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("business_id", DEMO_BUSINESS_ID)
    .order("publish_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Schedule[];
}

export async function fetchLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", DEMO_BUSINESS_ID)
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Lead[];
}

export async function fetchLeadMessages(leadId: string) {
  const { data, error } = await supabase
    .from("lead_messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LeadMessage[];
}

export async function saveBrandProfile(input: BrandProfileInput) {
  const keywords = [input.industry, input.tone, "fast response", "premium leads"].filter(Boolean) as string[];
  const { data, error } = await supabase
    .from("businesses")
    .update({
      name: input.name,
      website: input.website ?? null,
      industry: input.industry ?? null,
      audience: input.audience ?? null,
      offer: input.offer ?? null,
      tone: input.tone ?? null,
      positioning: `${input.name} helps ${input.audience || "growth teams"} move faster from attention to qualified demand.`,
      vibe_keywords: keywords,
      palette: {
        base: "asphalt",
        signal: "electric lime",
        heat: "amber boost",
        motion: "fastlane telemetry",
      },
      analyzed_at: new Date().toISOString(),
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", DEMO_BUSINESS_ID)
    .select("*")
    .single();
  if (error) throw error;
  return data as Business;
}

export async function createContentItem(input: CreateContentInput, business?: Business | null) {
  const draft = input.path === "ai" ? generatedDraft(input.title, input.pattern, business) : undefined;
  const { data, error } = await supabase
    .from("content_items")
    .insert({
      business_id: DEMO_BUSINESS_ID,
      title: input.title,
      path: input.path,
      pattern: input.pattern ?? null,
      notes: input.notes ?? null,
      status: input.path === "ai" ? "ready" : "in_production",
      hook: draft?.hook ?? null,
      script: draft?.script ?? null,
      caption: draft?.caption ?? null,
      hashtags: draft?.hashtags ?? [],
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ContentItem;
}

export async function createShootRequest(input: CreateShootInput) {
  const content = await createContentItem({ title: input.title, path: "offline", notes: input.brief });
  const { data, error } = await supabase
    .from("shoot_requests")
    .insert({
      business_id: DEMO_BUSINESS_ID,
      content_item_id: content.id,
      brief: input.brief,
      location: input.location,
      preferred_date: input.preferredDate || null,
      partner: "VasuDev MarketX",
      status: "requested",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ShootRequest;
}

export async function createSchedule(input: CreateScheduleInput) {
  const { data, error } = await supabase
    .from("schedules")
    .insert({
      business_id: DEMO_BUSINESS_ID,
      content_item_id: input.contentItemId || null,
      platform: input.platform,
      publish_at: input.publishAt || new Date().toISOString(),
      ad_budget: input.adBudget,
      audience_notes: input.audienceNotes,
      status: "scheduled",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Schedule;
}

export async function simulateLead(input: SimulatedLeadInput) {
  const tier = input.tier === "auto" ? scoreToTier(input.score) : input.tier;
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      business_id: DEMO_BUSINESS_ID,
      channel: input.channel,
      handle: input.handle,
      name: input.name,
      intent_summary: input.message,
      tier,
      score: input.score,
      reason: tier === "high" ? "Budget and timeline signal urgent buying intent." : "Needs more qualification before founder handoff.",
      status: "open",
      last_message_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (leadError) throw leadError;

  const { error: messageError } = await supabase.from("lead_messages").insert([
    { lead_id: lead.id, direction: "inbound", body: input.message, automated: false },
    {
      lead_id: lead.id,
      direction: "outbound",
      body: "Got it — sharing the fastest next step now. Can you confirm your launch timeline and expected monthly volume?",
      automated: true,
    },
  ]);
  if (messageError) throw messageError;
  return lead as Lead;
}

export async function updateLeadStatus(leadId: string, status: string) {
  const { data, error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Lead;
}
