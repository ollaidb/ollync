-- Migration : Ajouter la colonne ugc_actor_type à la table posts
-- Pour les annonces UGC : indique si l'annonceur est une marque ou un créateur
-- Valeurs : 'marque' (marque qui cherche un créateur) | 'createur' (créateur qui cherche une marque)

begin;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'posts'
      and column_name = 'ugc_actor_type'
  ) then
    alter table public.posts
    add column ugc_actor_type varchar(20) default null;

    comment on column public.posts.ugc_actor_type is
      'Pour UGC : marque (annonceur est une marque) ou createur (annonceur est un créateur)';
    raise notice 'Colonne ugc_actor_type ajoutée à posts';
  else
    raise notice 'Colonne ugc_actor_type existe déjà';
  end if;
end $$;

commit;
