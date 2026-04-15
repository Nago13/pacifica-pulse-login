
-- Create users table
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  trophies INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  league TEXT NOT NULL DEFAULT 'Bronze',
  last_played TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create predictions table
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  asset TEXT NOT NULL,
  direction TEXT,
  price_initial DOUBLE PRECISION,
  price_final DOUBLE PRECISION,
  variation_real DOUBLE PRECISION,
  result BOOLEAN NOT NULL DEFAULT false,
  trophies_delta INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Users policies (app has no auth, uses anonymous access)
CREATE POLICY "Anyone can read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update users" ON public.users FOR UPDATE USING (true);

-- Predictions policies
CREATE POLICY "Anyone can read predictions" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert predictions" ON public.predictions FOR INSERT WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX idx_predictions_created_at ON public.predictions(created_at);
CREATE INDEX idx_users_trophies ON public.users(trophies);
