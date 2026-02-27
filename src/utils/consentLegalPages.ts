/**
 * Mapping de chaque type de consentement vers la page légale la plus pertinente.
 * Chaque consentement doit diriger vers UNE seule page spécifique, pas la liste.
 */
export const CONSENT_TO_LEGAL_PAGE: Record<string, string> = {
  // Conditions obligatoires à l'inscription (CGU, Politique, CGV, Mentions)
  legal_obligatory: '/profile/legal/politique-confidentialite',
  // Cookies
  cookies: '/profile/legal/politique-cookies',
  // Notifications push
  push_notifications: '/profile/legal/politique-confidentialite',
  // Messagerie
  messaging: '/profile/legal/politique-confidentialite',
  // Médias (publication, profil, conversation)
  media: '/profile/legal/politique-confidentialite',
  // Localisation
  location: '/profile/legal/politique-confidentialite',
  // Données de profil
  profile_data: '/profile/legal/politique-confidentialite',
  // Analyse comportementale
  behavioral_data: '/profile/legal/politique-confidentialite',
  // Communications commerciales
  commercial_communications: '/profile/legal/politique-confidentialite'
}
