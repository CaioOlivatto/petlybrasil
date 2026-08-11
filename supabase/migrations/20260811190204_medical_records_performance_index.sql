create index if not exists medical_records_pet_id_date_idx
  on public.medical_records (pet_id, date desc);
