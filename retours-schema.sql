-- ================================================
-- TABLE RETOURS — À exécuter dans Supabase SQL Editor
-- ================================================

create table public.retours (
  id uuid default gen_random_uuid() primary key,
  vente_id uuid references public.ventes on delete cascade not null,
  boutique_id uuid references public.boutiques on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('total', 'partiel')),
  motif text,
  montant_rembourse numeric not null default 0,
  created_at timestamptz default now()
);

create table public.retour_items (
  id uuid default gen_random_uuid() primary key,
  retour_id uuid references public.retours on delete cascade not null,
  produit_id uuid references public.produits on delete set null,
  nom_produit text not null,
  quantite integer not null,
  prix_unitaire numeric not null,
  sous_total numeric not null
);

-- RLS
alter table public.retours enable row level security;
alter table public.retour_items enable row level security;

create policy "users own retours" on public.retours
  for all using (auth.uid() = user_id);

create policy "users own retour_items" on public.retour_items
  for all using (
    retour_id in (select id from public.retours where user_id = auth.uid())
  );

-- Fonction pour ré-incrémenter le stock lors d'un retour
create or replace function public.increment_stock(p_id uuid, qty integer)
returns void as $$
begin
  update public.produits set stock = stock + qty where id = p_id;
end;
$$ language plpgsql security definer;
