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

export function humanize(value: string) {
  return value.replace(/_/g, " ");
}

export function tierRank(tier: string) {
  return tier === "high" ? 0 : tier === "medium" ? 1 : 2;
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
