create or replace function public.is_space_member(sid uuid, uid uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.space_members where space_id = sid and user_id = uid);
$$;

create or replace function public.space_role(sid uuid, uid uuid)
returns text language sql security definer stable as $$
  select role from public.space_members where space_id = sid and user_id = uid limit 1;
$$;

drop policy if exists "spaces_select" on public.spaces;
create policy "spaces_select" on public.spaces for select using (
  is_public = true or owner_id = (select auth.uid()) or public.is_space_member(id, (select auth.uid()))
);

drop policy if exists "members_select" on public.space_members;
create policy "members_select" on public.space_members for select using (
  user_id = (select auth.uid())
  or public.is_space_member(space_id, (select auth.uid()))
  or exists (select 1 from public.spaces s where s.id = space_members.space_id and s.is_public = true)
);

drop policy if exists "items_select" on public.items;
create policy "items_select" on public.items for select using (
  exists (select 1 from public.spaces s where s.id = items.space_id and (
    s.is_public = true or public.is_space_member(s.id, (select auth.uid()))
  ))
);

drop policy if exists "items_insert" on public.items;
create policy "items_insert" on public.items for insert with check (
  public.space_role(items.space_id, (select auth.uid())) in ('owner','editor')
);

drop policy if exists "items_update" on public.items;
create policy "items_update" on public.items for update using (
  public.space_role(items.space_id, (select auth.uid())) in ('owner','editor')
);

drop policy if exists "items_delete" on public.items;
create policy "items_delete" on public.items for delete using (
  public.space_role(items.space_id, (select auth.uid())) in ('owner','editor')
);
