create or replace function public.join_space_by_invite(p_space_id uuid, p_invite_code text)
returns void language plpgsql security definer as $$
declare
  v_code text;
begin
  select invite_code into v_code from public.spaces where id = p_space_id;
  if v_code is null or v_code <> p_invite_code then
    raise exception 'invalid invite code';
  end if;
  insert into public.space_members (space_id, user_id, role)
  values (p_space_id, auth.uid(), 'editor')
  on conflict (space_id, user_id) do nothing;
end;
$$;
grant execute on function public.join_space_by_invite(uuid, text) to authenticated;
