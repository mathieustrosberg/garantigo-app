-- GarantiGo: tables, access rules and photo storage of the online copy.
-- Paste this file in the SQL editor of the Supabase project and run it once.

-- One row per purchase and per account.
create table public.purchases (
  -- Same id as on the phone. Two accounts can hold the same id (demonstration purchases).
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  purchase_date date not null,
  warranty_months integer not null check (warranty_months > 0),
  price numeric,
  category text check (category in ('high-tech', 'home', 'kitchen', 'other')),
  receipt_file_name text,
  -- Date of the last change on a phone: the most recent change wins.
  updated_at timestamptz not null,
  -- Set when the purchase is deleted: the row stays so that the other phones delete it too.
  deleted_at timestamptz,
  primary key (user_id, id)
);

-- Lets the signed-in users reach the table through the API, whatever the project settings.
grant select, insert, update, delete on public.purchases to authenticated;

-- Without this, every signed-in user could read every purchase.
alter table public.purchases enable row level security;

create policy "Each account reads and writes its own purchases"
  on public.purchases
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Private folder for the receipt photos: one sub-folder per account, named after its id.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false);

create policy "Each account reads and writes its own receipt photos"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
