
-- Create table for saved question lists
CREATE TABLE public.vet_question_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  questions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vet_question_lists ENABLE ROW LEVEL SECURITY;

-- For now allow all access (no auth yet)
CREATE POLICY "Allow all read access" ON public.vet_question_lists FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.vet_question_lists FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.vet_question_lists FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.vet_question_lists FOR DELETE USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vet_question_lists_updated_at
  BEFORE UPDATE ON public.vet_question_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
