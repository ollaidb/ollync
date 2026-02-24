/**
 * Modération fraude / arnaque / contenu inapproprié
 * - Utilise la fonction Supabase check_moderation_text (mots-clés en base)
 * - Permet de logger une activité suspecte pour analyse
 */

import { supabase } from '../lib/supabaseClient'

export type ModerationCategory = 'fraud' | 'nsfw' | 'spam' | 'scam' | 'phishing'

export interface ModerationCheckResult {
  score: number
  reasons: string[]
  flagged: boolean
}

const FLAG_THRESHOLD = 3

/**
 * Appelle la fonction SQL check_moderation_text pour détecter
 * mots-clés fraude, NSFW, spam dans le texte.
 */
export async function checkModerationTextFromDb(text: string): Promise<ModerationCheckResult> {
  if (!text || !String(text).trim()) {
    return { score: 0, reasons: [], flagged: false }
  }

  try {
    // RPC args not in generated types; cast for runtime call
    const { data, error } = (await (supabase as any).rpc('check_moderation_text', { input_text: String(text).trim() })) as { data: { score?: number; reasons?: string[] }[] | { score?: number; reasons?: string[] } | null; error: { message?: string } | null }

    if (error) {
      console.warn('[moderation] RPC check_moderation_text failed:', error.message)
      return { score: 0, reasons: [], flagged: false }
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) return { score: 0, reasons: [], flagged: false }

    const score = Number(row?.score) || 0
    const reasons: string[] = Array.isArray(row?.reasons) ? (row.reasons as string[]) : []
    const flagged = score >= FLAG_THRESHOLD

    return { score, reasons, flagged }
  } catch (e) {
    console.warn('[moderation] checkModerationTextFromDb error:', e)
    return { score: 0, reasons: [], flagged: false }
  }
}

/**
 * Vérifie un ensemble de champs texte (titre, description, etc.)
 * et retourne un résultat agrégé.
 */
export async function checkPostTextModeration(fields: {
  title?: string | null
  description?: string | null
  [key: string]: string | null | undefined
}): Promise<ModerationCheckResult> {
  const parts: string[] = []
  Object.values(fields).forEach((v) => {
    if (v && typeof v === 'string' && v.trim()) parts.push(v.trim())
  })
  const fullText = parts.join('\n')
  return checkModerationTextFromDb(fullText)
}

/**
 * Enregistre une activité suspecte pour l'utilisateur connecté
 * (ex. contenu d'un post flagué par la modération).
 */
export async function logSuspiciousActivity(params: {
  userId: string
  activityType: string
  sourceTable: string
  sourceId: string
  score: number
  details?: Record<string, unknown>
}): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('suspicious_activity') as any).insert({
      user_id: params.userId,
      activity_type: params.activityType,
      source_table: params.sourceTable,
      source_id: params.sourceId,
      score: params.score,
      details: params.details ?? null
    })
  } catch (e) {
    console.warn('[moderation] logSuspiciousActivity failed:', e)
  }
}
