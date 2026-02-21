begin;

do $$
declare
  v_casting_id uuid;
  v_invite_id uuid;
  v_youtube_video_id uuid;
  v_invite_podcast_id uuid;
  v_invite_micro_id uuid;
begin
  select id into v_casting_id
  from public.categories
  where slug in ('casting-role', 'casting', 'role', 'recrutement')
  order by case slug
    when 'casting-role' then 1
    when 'casting' then 2
    when 'role' then 3
    when 'recrutement' then 4
    else 99
  end
  limit 1;

  if v_casting_id is null then
    raise exception 'Categorie casting introuvable';
  end if;

  insert into public.sub_categories (category_id, name, slug)
  values (v_casting_id, 'Invité', 'invite')
  on conflict (category_id, slug) do update
  set name = excluded.name;

  select id into v_invite_id
  from public.sub_categories
  where category_id = v_casting_id and slug = 'invite'
  limit 1;

  if v_invite_id is null then
    raise exception 'Sous-categorie invite introuvable';
  end if;

  select id into v_youtube_video_id
  from public.sub_categories
  where category_id = v_casting_id and slug = 'youtube-video'
  limit 1;

  select id into v_invite_podcast_id
  from public.sub_categories
  where category_id = v_casting_id and slug = 'invite-podcast'
  limit 1;

  select id into v_invite_micro_id
  from public.sub_categories
  where category_id = v_casting_id and slug = 'invite-micro-trottoir'
  limit 1;

  update public.posts
  set sub_category_id = v_invite_id
  where category_id = v_casting_id
    and sub_category_id in (
      coalesce(v_youtube_video_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(v_invite_podcast_id, '00000000-0000-0000-0000-000000000000'::uuid),
      coalesce(v_invite_micro_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );

  delete from public.sub_categories
  where category_id = v_casting_id
    and slug in ('youtube-video', 'invite-podcast', 'invite-micro-trottoir');
end $$;

commit;

-- verification
select sc.slug, sc.name
from public.sub_categories sc
join public.categories c on c.id = sc.category_id
where c.slug in ('casting-role', 'casting', 'role', 'recrutement')
order by c.slug, sc.name;
