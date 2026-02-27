import { supabase } from '../lib/supabaseClient'

/**
 * Exporte toutes les données personnelles de l'utilisateur (droit à la portabilité, RGPD art. 20).
 * Les politiques RLS garantissent que seules les données de l'utilisateur connecté sont retournées.
 */
export interface ExportedUserData {
  export_date_iso: string
  user_id: string
  profile: unknown[] | null
  posts: unknown[] | null
  likes: unknown[] | null
  notifications: unknown[] | null
  match_requests: unknown[] | null
  applications: unknown[] | null
  conversations: unknown[] | null
  messages_sent: unknown[] | null
  follows_following: unknown[] | null
  follows_followers: unknown[] | null
}

export async function exportUserData(userId: string): Promise<ExportedUserData> {
  const dateIso = new Date().toISOString()

  const [
    profileRes,
    postsRes,
    likesRes,
    notificationsRes,
    matchRequestsRes,
    applicationsRes,
    conversationsRes,
    messagesRes,
    followsFollowingRes,
    followsFollowersRes
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId),
    supabase.from('posts').select('*').eq('user_id', userId),
    supabase.from('likes').select('*').eq('user_id', userId),
    supabase.from('notifications').select('*').eq('user_id', userId),
    // match_requests table may not be in generated Database types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('match_requests').select('*').or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
    supabase.from('applications').select('*').eq('applicant_id', userId),
    supabase.from('conversations').select('*').or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
    supabase.from('messages').select('*').eq('sender_id', userId),
    Promise.resolve(supabase.from('follows').select('*').eq('follower_id', userId)).catch(() => ({ data: null, error: { message: 'follows' } })),
    Promise.resolve(supabase.from('follows').select('*').eq('following_id', userId)).catch(() => ({ data: null, error: { message: 'follows' } }))
  ])

  const profile = profileRes.error ? null : profileRes.data
  const posts = postsRes.error ? null : postsRes.data
  const likes = likesRes.error ? null : likesRes.data
  const notifications = notificationsRes.error ? null : notificationsRes.data
  const match_requests = matchRequestsRes.error ? null : matchRequestsRes.data
  const applications = applicationsRes.error ? null : applicationsRes.data
  const conversations = conversationsRes.error ? null : conversationsRes.data
  const messages_sent = messagesRes.error ? null : messagesRes.data
  const follows_following = followsFollowingRes.data ?? null
  const follows_followers = followsFollowersRes.data ?? null

  return {
    export_date_iso: dateIso,
    user_id: userId,
    profile: profile ?? null,
    posts: posts ?? null,
    likes: likes ?? null,
    notifications: notifications ?? null,
    match_requests: match_requests ?? null,
    applications: applications ?? null,
    conversations: conversations ?? null,
    messages_sent: messages_sent ?? null,
    follows_following: follows_following ?? null,
    follows_followers: follows_followers ?? null
  }
}

/**
 * Déclenche le téléchargement du fichier JSON des données exportées.
 */
export function downloadExportedData(data: ExportedUserData, filename?: string): void {
  const name = filename || `ollync-donnees-${new Date().toISOString().slice(0, 10)}.json`
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
