begin;

-- 1) Supprimer toutes les videos existantes sur les publications
update public.posts
set video = null
where video is not null;

-- 2) Empêcher toute future video sur les publications
alter table public.posts
  drop constraint if exists posts_video_disabled_check;

alter table public.posts
  add constraint posts_video_disabled_check
  check (video is null);

commit;

-- Verification
select count(*) as posts_with_video
from public.posts
where video is not null;
