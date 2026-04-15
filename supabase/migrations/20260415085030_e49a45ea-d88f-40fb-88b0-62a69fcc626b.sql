
CREATE TABLE public.chests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'daily',
  mode TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  reward_type TEXT,
  reward_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chests" ON public.chests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chests" ON public.chests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update chests" ON public.chests FOR UPDATE USING (true);

CREATE INDEX idx_chests_user_id ON public.chests(user_id);
CREATE INDEX idx_chests_type ON public.chests(type);
