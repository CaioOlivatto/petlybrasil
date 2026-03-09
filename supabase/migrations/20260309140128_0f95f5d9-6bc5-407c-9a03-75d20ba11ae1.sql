
CREATE TABLE public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  energia text,
  apetite text,
  sono text,
  humor text,
  alteracoes text[] DEFAULT '{}',
  passeio boolean,
  atividade_mental boolean,
  mudanca_rotina text DEFAULT 'nenhuma',
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (pet_id, date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins" ON public.daily_checkins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON public.daily_checkins
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON public.daily_checkins
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON public.daily_checkins
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
