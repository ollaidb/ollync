-- ============================================
-- FIX: column messages.content_id does not exist
-- ============================================
-- Une requête demande "content_id" alors que la table messages a "content".
-- On recrée la vue en gardant m.* et en ajoutant content_id comme alias de content.
-- Exécutez dans le SQL Editor Supabase.

DROP VIEW IF EXISTS public.public_messages_with_sender;
CREATE VIEW public.public_messages_with_sender AS
SELECT
  m.*,
  m.content AS content_id,
  jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url
  ) AS sender
FROM public.messages m
LEFT JOIN public.profiles p ON p.id = m.sender_id;

GRANT SELECT ON public.public_messages_with_sender TO anon, authenticated;
