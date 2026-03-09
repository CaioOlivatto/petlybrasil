
-- Create medical records table
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  validity_date DATE,
  notes TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own medical records" ON public.medical_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical records" ON public.medical_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical records" ON public.medical_records
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical records" ON public.medical_records
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for medical attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-attachments', 'medical-attachments', true);

-- Storage RLS policies
CREATE POLICY "Users can upload medical attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medical-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view medical attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'medical-attachments');

CREATE POLICY "Users can delete own medical attachments" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'medical-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
