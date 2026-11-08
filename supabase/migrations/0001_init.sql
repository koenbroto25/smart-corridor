create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade,
  is_public boolean default false,
  invite_code text unique,
  created_at timestamptz default now()
);

create table if not exists public.space_members (
  space_id uuid references public.spaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner','editor','viewer')),
  primary key (space_id, user_id)
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references public.spaces(id) on delete cascade,
  type text check (type in ('note','link','image','video','article','game')),
  x float default 0,
  y float default 0,
  width float default 240,
  height float default 160,
  z_index int default 0,
  content jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists items_updated_at on public.items;
create trigger items_updated_at before update on public.items
for each row execute function public.set_updated_at();

create or replace function public.handle_new_space()
returns trigger as $$
begin
  insert into public.space_members (space_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_space_created on public.spaces;
create trigger on_space_created after insert on public.spaces
for each row execute function public.handle_new_space();

alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.items enable row level security;

create policy "spaces_select" on public.spaces for select using (
  is_public = true or owner_id = (select auth.uid()) or exists (select 1 from public.space_members sm where sm.space_id = spaces.id and sm.user_id = (select auth.uid()))
);
create policy "spaces_insert" on public.spaces for insert with check (owner_id = (select auth.uid()));
create policy "spaces_update" on public.spaces for update using (owner_id = (select auth.uid()));
create policy "spaces_delete" on public.spaces for delete using (owner_id = (select auth.uid()));

create policy "members_select" on public.space_members for select using (
  user_id = (select auth.uid())
  or exists (select 1 from public.space_members sm where sm.space_id = space_members.space_id and sm.user_id = (select auth.uid()))
  or exists (select 1 from public.spaces s where s.id = space_members.space_id and s.is_public = true)
);
create policy "members_insert" on public.space_members for insert with check (
  exists (select 1 from public.spaces s where s.id = space_id and s.owner_id = (select auth.uid()))
);
create policy "members_update" on public.space_members for update using (
  exists (select 1 from public.spaces s where s.id = space_id and s.owner_id = (select auth.uid()))
);
create policy "members_delete" on public.space_members for delete using (
  exists (select 1 from public.spaces s where s.id = space_id and s.owner_id = (select auth.uid()))
);

create policy "items_select" on public.items for select using (
  exists (select 1 from public.spaces s where s.id = items.space_id and (
    s.is_public = true or exists (select 1 from public.space_members sm where sm.space_id = s.id and sm.user_id = (select auth.uid()))
  ))
);
create policy "items_insert" on public.items for insert with check (
  exists (select 1 from public.space_members sm where sm.space_id = items.space_id and sm.user_id = (select auth.uid()) and sm.role in ('owner','editor'))
);
create policy "items_update" on public.items for update using (
  exists (select 1 from public.space_members sm where sm.space_id = items.space_id and sm.user_id = (select auth.uid()) and sm.role in ('owner','editor'))
);
create policy "items_delete" on public.items for delete using (
  exists (select 1 from public.space_members sm where sm.space_id = items.space_id and sm.user_id = (select auth.uid()) and sm.role in ('owner','editor'))
);

insert into storage.buckets (id, name, public) values ('images','images',true) on conflict (id) do nothing;

create policy "images_public_read" on storage.objects for select using (bucket_id = 'images');
create policy "images_auth_insert" on storage.objects for insert with check (bucket_id = 'images' and auth.role() = 'authenticated');

alter publication supabase_realtime add table public.items;
