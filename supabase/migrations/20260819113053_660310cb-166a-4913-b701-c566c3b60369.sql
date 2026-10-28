CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  audience TEXT,
  tone TEXT,
  offer TEXT,
  vibe_keywords TEXT[] NOT NULL DEFAULT '{}',
  palette JSONB NOT NULL DEFAULT '[]'::jsonb,
  positioning TEXT,
  auto_reply_tone TEXT NOT NULL DEFAULT 'fast, friendly, direct',
  auto_reply_template TEXT,
  instagram_connected BOOLEAN NOT NULL DEFAULT false,
  facebook_connected BOOLEAN NOT NULL DEFAULT false,
  whatsapp_connected BOOLEAN NOT NULL DEFAULT false,
  onboarded_at TIMESTAMP WITH TIME ZONE,
  analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO anon, authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open demo access to businesses" ON public.businesses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT 'ai',
  status TEXT NOT NULL DEFAULT 'idea',
  pattern TEXT,
  hook TEXT,
  script TEXT,
  caption TEXT,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_items TO anon, authenticated;
GRANT ALL ON public.content_items TO service_role;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open demo access to content_items" ON public.content_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.shoot_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  brief TEXT,
  location TEXT,
  preferred_date DATE,
  partner TEXT NOT NULL DEFAULT 'VasuDev MarketX',
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shoot_requests TO anon, authenticated;
GRANT ALL ON public.shoot_requests TO service_role;
ALTER TABLE public.shoot_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open demo access to shoot_requests" ON public.shoot_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  publish_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ad_budget NUMERIC NOT NULL DEFAULT 0,
  audience_notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedules TO anon, authenticated;
GRANT ALL ON public.schedules TO service_role;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open demo access to schedules" ON public.schedules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'instagram',
  handle TEXT NOT NULL,
  name TEXT,
  intent_summary TEXT,
  tier TEXT NOT NULL DEFAULT 'medium',
  score INTEGER NOT NULL DEFAULT 50,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  source_content_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO anon, authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open demo access to leads" ON public.leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.lead_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'inbound',
  body TEXT NOT NULL,
  automated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_messages TO anon, authenticated;
GRANT ALL ON public.lead_messages TO service_role;
ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open demo access to lead_messages" ON public.lead_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER businesses_touch BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER content_items_touch BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER shoot_requests_touch BEFORE UPDATE ON public.shoot_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER schedules_touch BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER leads_touch BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.businesses (id, name, website, industry, audience, tone, offer, vibe_keywords, palette, positioning, auto_reply_template, instagram_connected, facebook_connected, whatsapp_connected, onboarded_at, analyzed_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'Kettle & Co.', 'https://kettleandco.in', 'Specialty coffee retail', 'Urban 22-35 coffee enthusiasts', 'Warm, confident, a little cheeky', 'Single-origin subscription boxes from INR 899/mo', ARRAY['warm','artisanal','high-contrast','tactile'], '["#0E0E0E","#D7FF3E","#F2E8DA","#C2440E"]'::jsonb, 'The daily ritual, upgraded — single-origin coffee without the snobbery.', 'Hey! Thanks for reaching out about our subscription boxes. Quick question so I can help fast: are you buying for yourself or for a team?', true, true, true, now() - interval '21 days', now() - interval '21 days');

INSERT INTO public.content_items (id, business_id, title, path, status, pattern, hook, script, caption, hashtags) VALUES
('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'POV: your 7am pour-over', 'ai', 'published', 'POV micro-story', 'POV: it is 7am and this cup decides your whole day.', E'0-2s: hands, steam, hard cut.\n2-6s: pour in slow motion, text overlay "single origin, no snobbery".\n6-12s: taste reaction, price reveal.\n12-15s: CTA "DM us BOX".', 'Your 7am deserves better than instant. DM us BOX to start.', ARRAY['#coffeelover','#singleorigin','#pourover']),
('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Three roasts, one blind test', 'offline', 'in_production', NULL, NULL, NULL, NULL, ARRAY['#blindtaste','#coffee']),
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'Founder answers: why INR 899?', 'ai', 'ready', 'Objection teardown', 'Everyone asks why our box costs less than two cafe lattes.', E'0-3s: direct-to-camera hook.\n3-9s: cost breakdown on screen.\n9-14s: "we cut the cafe, not the beans".\n14-18s: CTA.', 'The maths behind INR 899. No cafe markup, no middlemen.', ARRAY['#pricing','#founderstory']),
('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', 'Barista reacts to office coffee', 'ai', 'scheduled', 'Reaction stitch', 'A barista watched your office coffee setup. It did not go well.', E'0-3s: cringe office pantry shot.\n3-10s: barista reaction beats.\n10-16s: fix it with our office box.', 'Office coffee crimes, ranked. Fix yours.', ARRAY['#officecoffee','#barista']),
('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111', 'Roastery walkthrough (long form)', 'offline', 'idea', NULL, NULL, NULL, NULL, ARRAY['#roastery']);

INSERT INTO public.shoot_requests (business_id, content_item_id, brief, location, preferred_date, status) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', 'Blind taste test with three regulars, handheld, natural light, 3 reels + 1 long cut.', 'Kettle & Co. flagship, Indiranagar', CURRENT_DATE + 4, 'scheduled'),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222205', 'Roastery walkthrough with founder voiceover, gimbal, golden hour.', 'Peenya roastery unit', CURRENT_DATE + 12, 'requested');

INSERT INTO public.schedules (business_id, content_item_id, platform, publish_at, ad_budget, audience_notes, status) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'instagram', now() - interval '3 days', 4500, 'Bengaluru 22-35, coffee + cafe interest, lookalike of DM openers', 'published'),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222204', 'instagram', now() + interval '2 days', 3000, 'Office/HR audiences, 25-40, Bengaluru + Hyderabad', 'scheduled'),
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222203', 'facebook', now() + interval '5 days', 2500, 'Retargeting site visitors, 30-day window', 'scheduled');

INSERT INTO public.leads (id, business_id, channel, handle, name, intent_summary, tier, score, reason, status, source_content_id, last_message_at) VALUES
('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', 'whatsapp', '+91 98450 11234', 'Ritika Shah', 'Wants 40 office boxes monthly for her design studio, asked for GST invoice.', 'high', 92, 'Bulk B2B volume, budget stated, decision maker, urgent timeline.', 'new', '22222222-2222-2222-2222-222222222201', now() - interval '12 minutes'),
('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', 'instagram', '@arjun.brews', 'Arjun M', 'Comparing our box with two competitors, asked about roast dates.', 'medium', 61, 'Engaged and informed but still comparing, single subscription value.', 'engaged', '22222222-2222-2222-2222-222222222201', now() - interval '2 hours'),
('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', 'instagram', '@thecuriouscup', 'Neha', 'Asked only if we ship to Nepal, no budget signal.', 'low', 22, 'Out of serviceable region, no purchase intent stated.', 'new', '22222222-2222-2222-2222-222222222201', now() - interval '5 hours'),
('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111111', 'whatsapp', '+91 99000 55871', 'Sandeep Rao', 'Cafe owner wants wholesale pricing for 20kg/month.', 'high', 88, 'Recurring wholesale volume, clear quantity, owner-level contact.', 'engaged', '22222222-2222-2222-2222-222222222204', now() - interval '1 hour'),
('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111111', 'instagram', '@justvibes_99', NULL, 'Asked for free samples, no other intent.', 'low', 14, 'Freebie seeker, no budget or timeline.', 'archived', NULL, now() - interval '1 day'),
('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111111', 'whatsapp', '+91 91234 77120', 'Meera Iyer', 'Gifting 15 boxes for Diwali clients, needs custom sleeves.', 'high', 79, 'Sizeable one-off order with upsell on custom packaging.', 'won', '22222222-2222-2222-2222-222222222201', now() - interval '2 days');

INSERT INTO public.lead_messages (lead_id, direction, body, automated, created_at) VALUES
('33333333-3333-3333-3333-333333333301', 'inbound', 'Hi, saw your reel. Do you supply to offices? We are about 40 people.', false, now() - interval '20 minutes'),
('33333333-3333-3333-3333-333333333301', 'outbound', 'Hey Ritika! Yes — office boxes ship every 2 weeks. For 40 people we would do the 20kg plan. Do you need a GST invoice?', true, now() - interval '19 minutes'),
('33333333-3333-3333-3333-333333333301', 'inbound', 'Yes GST needed. Send pricing, we want to start next month.', false, now() - interval '12 minutes'),
('33333333-3333-3333-3333-333333333302', 'inbound', 'What are the roast dates on the Chikmagalur lot?', false, now() - interval '3 hours'),
('33333333-3333-3333-3333-333333333302', 'outbound', 'Roasted every Tuesday and shipped within 48 hours. Want me to hold this week''s batch for you?', true, now() - interval '3 hours'),
('33333333-3333-3333-3333-333333333302', 'inbound', 'Maybe. Checking two other brands first.', false, now() - interval '2 hours'),
('33333333-3333-3333-3333-333333333303', 'inbound', 'Do you ship to Nepal?', false, now() - interval '5 hours'),
('33333333-3333-3333-3333-333333333303', 'outbound', 'Not yet — we ship across India only right now. I''ll keep you posted when that changes!', true, now() - interval '5 hours'),
('33333333-3333-3333-3333-333333333304', 'inbound', 'Wholesale rates for 20kg a month for my cafe?', false, now() - interval '2 hours'),
('33333333-3333-3333-3333-333333333304', 'outbound', 'Absolutely. 20kg/month lands at wholesale tier 2. Sharing the sheet — are you roasting for espresso or filter?', true, now() - interval '2 hours'),
('33333333-3333-3333-3333-333333333304', 'inbound', 'Espresso mostly. Send the sheet.', false, now() - interval '1 hour'),
('33333333-3333-3333-3333-333333333306', 'inbound', 'Need 15 gift boxes for Diwali with our logo on the sleeve.', false, now() - interval '3 days'),
('33333333-3333-3333-3333-333333333306', 'outbound', 'Love it. Custom sleeves need 10 days lead time. Shall I block 15 boxes for you?', true, now() - interval '3 days'),
('33333333-3333-3333-3333-333333333306', 'inbound', 'Yes please, blocking confirmed.', false, now() - interval '2 days');