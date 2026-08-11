alter table public.pets
  add column if not exists emergency_token uuid default gen_random_uuid();

update public.pets
set emergency_token = gen_random_uuid()
where emergency_token is null;

alter table public.pets
  alter column emergency_token set not null;

create unique index if not exists pets_emergency_token_key
  on public.pets(emergency_token);
