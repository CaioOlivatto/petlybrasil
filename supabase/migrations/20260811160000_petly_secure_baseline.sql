create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text,
  birthday date,
  email text,
  phone text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  species text not null default 'dog',
  breed text,
  sex text,
  birth_date date,
  weight numeric,
  blood_type text,
  mother_name text,
  father_name text,
  pedigree text,
  kennel text,
  photo_url text,
  emergency_token uuid not null default gen_random_uuid() unique,
  is_neutered boolean default false,
  allergies text,
  health_conditions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vet_question_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  questions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pet_vaccinations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references public.pets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  vaccine_key text not null,
  status text not null default 'pending' check (status in ('taken', 'not_taken', 'will_not_take', 'pending')),
  date_taken date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pet_id, vaccine_key)
);

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pet_id uuid references public.pets(id) on delete cascade not null,
  date date not null default current_date,
  energia text,
  apetite text,
  sono text,
  humor text,
  alteracoes text[] default '{}',
  passeio boolean,
  passeio_quantidade integer default 0,
  passeio_duracao text,
  atividade_mental boolean,
  mudanca_rotina text default 'nenhuma',
  observacoes text,
  convulsao boolean default false,
  convulsao_quantidade integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pet_id, date)
);

create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pet_id uuid references public.pets(id) on delete cascade not null,
  category text not null,
  name text not null,
  date date not null,
  validity_date date,
  usage_end_date date,
  frequency text,
  notes text,
  attachment_url text,
  attachment_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agenda_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pet_id uuid references public.pets(id) on delete cascade not null,
  title text not null,
  category text not null default 'outro',
  date date not null,
  time text,
  notes text,
  source text default 'manual',
  source_record_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.vet_question_lists enable row level security;
alter table public.pet_vaccinations enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.medical_records enable row level security;
alter table public.agenda_events enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "pets_select_own" on public.pets for select to authenticated using ((select auth.uid()) = user_id);
create policy "pets_insert_own" on public.pets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "pets_update_own" on public.pets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "pets_delete_own" on public.pets for delete to authenticated using ((select auth.uid()) = user_id);

create policy "vet_lists_select_own" on public.vet_question_lists for select to authenticated using ((select auth.uid()) = user_id);
create policy "vet_lists_insert_own" on public.vet_question_lists for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "vet_lists_update_own" on public.vet_question_lists for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "vet_lists_delete_own" on public.vet_question_lists for delete to authenticated using ((select auth.uid()) = user_id);

create policy "vaccinations_select_own" on public.pet_vaccinations for select to authenticated using ((select auth.uid()) = user_id);
create policy "vaccinations_insert_own" on public.pet_vaccinations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "vaccinations_update_own" on public.pet_vaccinations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "vaccinations_delete_own" on public.pet_vaccinations for delete to authenticated using ((select auth.uid()) = user_id);

create policy "checkins_select_own" on public.daily_checkins for select to authenticated using ((select auth.uid()) = user_id);
create policy "checkins_insert_own" on public.daily_checkins for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "checkins_update_own" on public.daily_checkins for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "checkins_delete_own" on public.daily_checkins for delete to authenticated using ((select auth.uid()) = user_id);

create policy "medical_select_own" on public.medical_records for select to authenticated using ((select auth.uid()) = user_id);
create policy "medical_insert_own" on public.medical_records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "medical_update_own" on public.medical_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "medical_delete_own" on public.medical_records for delete to authenticated using ((select auth.uid()) = user_id);

create policy "agenda_select_own" on public.agenda_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "agenda_insert_own" on public.agenda_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "agenda_update_own" on public.agenda_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "agenda_delete_own" on public.agenda_events for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email) values (new.id, new.email);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();
create trigger update_pets_updated_at before update on public.pets for each row execute function public.update_updated_at_column();
create trigger update_vet_question_lists_updated_at before update on public.vet_question_lists for each row execute function public.update_updated_at_column();
create trigger update_medical_records_updated_at before update on public.medical_records for each row execute function public.update_updated_at_column();
create trigger update_agenda_events_updated_at before update on public.agenda_events for each row execute function public.update_updated_at_column();

create index pets_user_id_idx on public.pets(user_id);
create index vet_question_lists_user_id_idx on public.vet_question_lists(user_id);
create index pet_vaccinations_user_id_idx on public.pet_vaccinations(user_id);
create index pet_vaccinations_pet_id_idx on public.pet_vaccinations(pet_id);
create index daily_checkins_user_id_idx on public.daily_checkins(user_id);
create index daily_checkins_pet_id_idx on public.daily_checkins(pet_id);
create index medical_records_user_id_idx on public.medical_records(user_id);
create index medical_records_pet_id_idx on public.medical_records(pet_id);
create index agenda_events_user_id_idx on public.agenda_events(user_id);
create index agenda_events_pet_id_idx on public.agenda_events(pet_id);

insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('pet-photos', 'pet-photos', true),
  ('medical-attachments', 'medical-attachments', false);

create policy "avatars_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_select_public" on storage.objects for select to public using (bucket_id = 'avatars');
create policy "avatars_update_own" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "pet_photos_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "pet_photos_select_public" on storage.objects for select to public using (bucket_id = 'pet-photos');
create policy "pet_photos_update_own" on storage.objects for update to authenticated using (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "pet_photos_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'pet-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "medical_attachments_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'medical-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "medical_attachments_select_own" on storage.objects for select to authenticated using (bucket_id = 'medical-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "medical_attachments_update_own" on storage.objects for update to authenticated using (bucket_id = 'medical-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'medical-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "medical_attachments_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'medical-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
