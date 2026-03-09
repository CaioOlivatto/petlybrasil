
CREATE TABLE public.pet_vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  vaccine_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('taken', 'not_taken', 'will_not_take', 'pending')),
  date_taken date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (pet_id, vaccine_key)
);

ALTER TABLE public.pet_vaccinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pet vaccinations" ON public.pet_vaccinations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pet vaccinations" ON public.pet_vaccinations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pet vaccinations" ON public.pet_vaccinations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pet vaccinations" ON public.pet_vaccinations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
