-- Extend profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS anonymous_handle text,
  ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT true;

-- Generate referral codes for existing users (and a default for new ones via trigger)
UPDATE public.profiles SET referral_code = lower(substr(md5(random()::text || user_id::text), 1, 8)) WHERE referral_code IS NULL;
UPDATE public.profiles SET anonymous_handle = 'Bloom' || substr(md5(random()::text || user_id::text), 1, 4) WHERE anonymous_handle IS NULL;

-- Update handle_new_user to set defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, referral_code, anonymous_handle)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    lower(substr(md5(random()::text || NEW.id::text), 1, 8)),
    'Bloom' || substr(md5(random()::text || NEW.id::text), 1, 4)
  );
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists for new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== PARTNERS ==============
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  partner_id uuid,
  invite_email text,
  invite_code text NOT NULL UNIQUE DEFAULT lower(substr(md5(random()::text), 1, 10)),
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, revoked
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views own invites" ON public.partners FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = partner_id);
CREATE POLICY "Owner inserts invites" ON public.partners FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner or partner updates" ON public.partners FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = partner_id);
CREATE POLICY "Owner deletes invites" ON public.partners FOR DELETE USING (auth.uid() = owner_id);

-- Allow lookup of pending invite by code (needed before accepting)
CREATE POLICY "Authenticated can lookup by pending status" ON public.partners FOR SELECT 
  USING (status = 'pending' AND auth.uid() IS NOT NULL);

CREATE TABLE public.partner_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  share_period boolean NOT NULL DEFAULT true,
  share_ovulation boolean NOT NULL DEFAULT true,
  share_fertile boolean NOT NULL DEFAULT true,
  share_pms boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User manages own shares" ON public.partner_shares FOR ALL 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Partner can view shares of their connected owner
CREATE POLICY "Partner views shares" ON public.partner_shares FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.partners 
    WHERE partners.owner_id = partner_shares.user_id 
      AND partners.partner_id = auth.uid() 
      AND partners.status = 'accepted'
  ));

-- Allow connected partner to read owner's profile + periods (limited)
CREATE POLICY "Partner views connected profile" ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.owner_id = profiles.user_id
      AND partners.partner_id = auth.uid()
      AND partners.status = 'accepted'
  ));

CREATE POLICY "Partner views connected periods" ON public.periods FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.partners
    WHERE partners.owner_id = periods.user_id
      AND partners.partner_id = auth.uid()
      AND partners.status = 'accepted'
  ));

-- ============== COMMUNITY ==============
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  anonymous_handle text NOT NULL,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed reads posts" ON public.posts FOR SELECT 
  USING (auth.uid() IS NOT NULL AND is_hidden = false);
CREATE POLICY "Owner reads own posts" ON public.posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authed creates posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner deletes posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL,
  anonymous_handle text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authed reads comments" ON public.comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authed creates comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner deletes comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authed reads likes" ON public.post_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authed creates likes" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner deletes likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authed creates reports" ON public.post_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Reporter views own reports" ON public.post_reports FOR SELECT USING (auth.uid() = reporter_id);

-- Triggers to maintain counts
CREATE OR REPLACE FUNCTION public.bump_post_likes() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id; RETURN NEW; END IF;
  IF TG_OP = 'DELETE' THEN UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id; RETURN OLD; END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_post_likes_count AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.bump_post_likes();

CREATE OR REPLACE FUNCTION public.bump_post_comments() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id; RETURN NEW; END IF;
  IF TG_OP = 'DELETE' THEN UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id; RETURN OLD; END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_post_comments_count AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.bump_post_comments();

-- ============== REFERRALS ==============
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  invitee_email text,
  invitee_user_id uuid,
  status text NOT NULL DEFAULT 'sent', -- sent, signed_up
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrer views own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Authed creates referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- ============== SUBSCRIPTIONS ==============
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free', -- free, premium
  billing_cycle text, -- monthly, yearly
  status text NOT NULL DEFAULT 'active', -- active, canceled, trial
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User views own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User inserts own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User updates own subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- updated_at triggers
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_partner_shares_updated BEFORE UPDATE ON public.partner_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();