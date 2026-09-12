CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_url TEXT,
  objective TEXT,
  big_idea TEXT,
  audience TEXT,
  brand_voice TEXT,
  duration_days INTEGER NOT NULL DEFAULT 14,
  channel_mix JSONB NOT NULL DEFAULT '[]'::jsonb,
  palette JSONB NOT NULL DEFAULT '[]'::jsonb,
  vibe_keywords TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  source TEXT NOT NULL DEFAULT 'ai',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO anon, authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open demo access to campaigns" ON public.campaigns FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.campaign_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  day_offset INTEGER NOT NULL DEFAULT 0,
  platform TEXT NOT NULL DEFAULT 'instagram',
  format TEXT NOT NULL DEFAULT 'reel',
  pattern TEXT,
  hook TEXT NOT NULL,
  script TEXT,
  caption TEXT,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  visual_prompt TEXT,
  visual_style TEXT,
  visual_url TEXT,
  headline TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_posts TO anon, authenticated;
GRANT ALL ON public.campaign_posts TO service_role;
ALTER TABLE public.campaign_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open demo access to campaign_posts" ON public.campaign_posts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_campaign_posts_campaign ON public.campaign_posts(campaign_id, position);
CREATE INDEX idx_campaigns_business ON public.campaigns(business_id, created_at DESC);

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaign_posts_updated_at BEFORE UPDATE ON public.campaign_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Demo read campaign visuals" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'campaign-visuals');