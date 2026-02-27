/**
 * Retour haptique subtil style iOS pour actions tactiles.
 * Utilise navigator.vibrate avec des patterns courts (pas de vibration forte).
 */

const canVibrate = (): boolean =>
  typeof navigator !== 'undefined' && 'vibrate' in navigator

/** Tap léger : like, favori, sélection */
export function hapticLight(): void {
  if (!canVibrate()) return
  try {
    navigator.vibrate(5)
  } catch {
    // ignore
  }
}

/** Succès : action confirmée (enregistrement, envoi, sauvegarde) */
export function hapticSuccess(): void {
  if (!canVibrate()) return
  try {
    navigator.vibrate([8, 4, 8])
  } catch {
    // ignore
  }
}

/** Avertissement : suppression, archivage (à utiliser avant confirmation) */
export function hapticWarning(): void {
  if (!canVibrate()) return
  try {
    navigator.vibrate([12, 6])
  } catch {
    // ignore
  }
}
