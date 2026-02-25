/**
 * Vérifie qu'une URL de redirection (returnTo) est sûre : même origine, path uniquement.
 * Refuse les valeurs avec protocole, host ou "//".
 */
export function isSafeReturnTo(value: string | null | undefined): boolean {
  if (value == null || typeof value !== 'string') return false
  const trimmed = value.trim()
  if (trimmed === '') return false
  if (!trimmed.startsWith('/')) return false
  if (trimmed.includes('//')) return false
  return true
}
