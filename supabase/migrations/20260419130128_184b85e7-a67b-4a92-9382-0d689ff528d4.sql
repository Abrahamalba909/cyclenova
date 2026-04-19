-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  age INTEGER,
  cycle_length INTEGER NOT NULL DEFAULT 28,
  period_length INTEGER NOT NULL DEFAULT 5,
  last_period_start DATE,
  intention TEXT NOT NULL DEFAULT 'tracking' CHECK (intention IN ('conceive','avoid','tracking')),
  onboarded BOOLEAN NOT NULL DEFAULT false,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- Periods table (period log entries)
CREATE TABLE public.periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  flow TEXT CHECK (flow IN ('light','medium','heavy')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own periods" ON public.periods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own periods" ON public.periods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own periods" ON public.periods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own periods" ON public.periods FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_periods_user_start ON public.periods(user_id, start_date DESC);

-- Symptoms log
CREATE TABLE public.symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  cramps INTEGER DEFAULT 0 CHECK (cramps BETWEEN 0 AND 5),
  headache INTEGER DEFAULT 0 CHECK (headache BETWEEN 0 AND 5),
  mood INTEGER DEFAULT 0 CHECK (mood BETWEEN 0 AND 5),
  acne INTEGER DEFAULT 0 CHECK (acne BETWEEN 0 AND 5),
  bloating INTEGER DEFAULT 0 CHECK (bloating BETWEEN 0 AND 5),
  back_pain INTEGER DEFAULT 0 CHECK (back_pain BETWEEN 0 AND 5),
  fatigue INTEGER DEFAULT 0 CHECK (fatigue BETWEEN 0 AND 5),
  energy INTEGER DEFAULT 0 CHECK (energy BETWEEN 0 AND 5),
  sleep INTEGER DEFAULT 0 CHECK (sleep BETWEEN 0 AND 5),
  libido INTEGER DEFAULT 0 CHECK (libido BETWEEN 0 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own symptoms" ON public.symptoms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own symptoms" ON public.symptoms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own symptoms" ON public.symptoms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own symptoms" ON public.symptoms FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_symptoms_user_date ON public.symptoms(user_id, log_date DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_periods_updated_at BEFORE UPDATE ON public.periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_symptoms_updated_at BEFORE UPDATE ON public.symptoms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();