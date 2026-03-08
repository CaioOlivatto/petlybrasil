
DROP POLICY IF EXISTS "Allow all delete access" ON public.vet_question_lists;
DROP POLICY IF EXISTS "Allow all insert access" ON public.vet_question_lists;
DROP POLICY IF EXISTS "Allow all update access" ON public.vet_question_lists;

CREATE POLICY "Authenticated users can insert vet questions"
  ON public.vet_question_lists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update vet questions"
  ON public.vet_question_lists FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete vet questions"
  ON public.vet_question_lists FOR DELETE TO authenticated USING (true);
