ALTER TABLE public.daily_checkins ADD COLUMN passeio_quantidade integer DEFAULT 0;
ALTER TABLE public.daily_checkins ADD COLUMN passeio_duracao text DEFAULT null;