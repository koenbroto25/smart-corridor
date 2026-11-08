alter table public.spaces add column if not exists cover_image text;
alter table public.spaces add column if not exists cover_color text default '#fef08a';
grant all on public.spaces to anon, authenticated, service_role;
