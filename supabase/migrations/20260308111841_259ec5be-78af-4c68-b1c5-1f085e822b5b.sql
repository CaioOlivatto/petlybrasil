
-- Add missing columns to pets table
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS is_neutered BOOLEAN DEFAULT false;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS health_conditions TEXT;
