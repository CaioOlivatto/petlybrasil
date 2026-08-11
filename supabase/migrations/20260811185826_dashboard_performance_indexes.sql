create index if not exists pets_user_id_created_at_idx
  on public.pets (user_id, created_at);

create index if not exists agenda_events_pet_id_date_idx
  on public.agenda_events (pet_id, date);

create index if not exists daily_checkins_pet_id_date_idx
  on public.daily_checkins (pet_id, date desc);
