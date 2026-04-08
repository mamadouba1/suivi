-- ================================================
-- SUIVI DÉPENSES FAMILIALES — Schéma Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- ================================================

-- Profils utilisateurs
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  devise text default 'FCFA',
  created_at timestamptz default now()
);

-- Entrées (revenus)
create table public.entrees (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  mois text not null,
  personne text not null,
  montant numeric not null default 0,
  created_at timestamptz default now()
);

-- Dépenses
create table public.depenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  mois text not null,
  type text not null,
  libelle text not null,
  montant_prev numeric default 0,
  montant_depense numeric default 0,
  personne text,
  created_at timestamptz default now()
);

-- Budgets mensuels (alertes)
create table public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  mois text not null,
  type text not null,
  plafond numeric not null,
  unique(user_id, mois, type)
);

-- Row Level Security (chaque user ne voit QUE ses données)
alter table public.profiles enable row level security;
alter table public.entrees enable row level security;
alter table public.depenses enable row level security;
alter table public.budgets enable row level security;

create policy "users own profiles" on public.profiles
  for all using (auth.uid() = id);

create policy "users own entrees" on public.entrees
  for all using (auth.uid() = user_id);

create policy "users own depenses" on public.depenses
  for all using (auth.uid() = user_id);

create policy "users own budgets" on public.budgets
  for all using (auth.uid() = user_id);

-- Créer le profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
