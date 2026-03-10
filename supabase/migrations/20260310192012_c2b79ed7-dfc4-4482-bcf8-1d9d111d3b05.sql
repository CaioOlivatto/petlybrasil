ALTER TABLE public.daily_checkins ADD COLUMN convulsao boolean DEFAULT false;
ALTER TABLE public.daily_checkins ADD COLUMN convulsao_quantidade integer DEFAULT 0;