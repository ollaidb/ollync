-- ============================================
-- FONCTION POUR SUPPRIMER UN COMPTE UTILISATEUR
-- ============================================
-- IMPORTANT: Cette fonction supprime toutes les données publiques de l'utilisateur
-- mais NE PEUT PAS supprimer l'utilisateur de auth.users (nécessite l'API Admin)
-- 
-- Pour une suppression complète, vous devez :
-- 1. Créer une Edge Function Supabase qui utilise l'API Admin
-- 2. Appeler cette fonction depuis votre application
-- 
-- Cette fonction SQL supprime uniquement les données publiques (profil, posts, etc.)
-- L'utilisateur restera dans auth.users mais sans aucune donnée associée

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur actuellement connecté
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté pour supprimer votre compte';
  END IF;
  
  -- Supprimer le profil de l'utilisateur
  -- Cela déclenchera automatiquement la suppression en cascade de toutes les données
  -- associées grâce aux contraintes ON DELETE CASCADE :
  -- - Tous les posts créés par l'utilisateur (posts.user_id)
  -- - Tous les likes (likes.user_id)
  -- - Tous les commentaires (comments.user_id)
  -- - Tous les partages (shares.user_id)
  -- - Tous les messages (messages.sender_id)
  -- - Tous les follows (follows.follower_id, follows.following_id)
  -- - Toutes les candidatures (applications.applicant_id)
  -- - Toutes les conversations (conversations.user1_id, conversations.user2_id)
  -- - Toutes les notifications (notifications.user_id)
  -- - Et toutes les autres données liées via des clés étrangères
  
  DELETE FROM public.profiles WHERE id = current_user_id;
  
  -- NOTE: L'utilisateur restera dans auth.users mais sans aucune donnée
  -- Pour supprimer complètement l'utilisateur de auth.users, vous devez :
  -- 1. Créer une Edge Function Supabase qui utilise supabase.auth.admin.deleteUser()
  -- 2. Appeler cette Edge Function depuis votre application au lieu de cette fonction RPC
  -- 
  -- Exemple de Edge Function (à créer dans supabase/functions/delete-user-account):
  -- import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
  -- import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
  -- 
  -- serve(async (req) => {
  --   const supabaseAdmin = createClient(
  --     Deno.env.get('SUPABASE_URL') ?? '',
  --     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  --   )
  --   const authHeader = req.headers.get('Authorization')!
  --   const token = authHeader.replace('Bearer ', '')
  --   const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  --   await supabaseAdmin.auth.admin.deleteUser(user.id)
  --   return new Response(JSON.stringify({ success: true }), {
  --     headers: { 'Content-Type': 'application/json' }
  --   })
  -- })
  
END;
$$;

-- Donner la permission d'exécuter cette fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- Note: Cette fonction doit être exécutée dans le SQL Editor de Supabase
-- pour être disponible dans votre base de données

