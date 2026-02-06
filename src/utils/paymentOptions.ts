/**
 * Configuration des moyens de paiement avec descriptions pour chaque option
 */

export interface PaymentOption {
  id: string
  name: string
  description: string
}

export const PAYMENT_OPTIONS_CONFIG: PaymentOption[] = [
  {
    id: 'co-creation',
    name: 'Co-création',
    description: 'Collaboration créative où les deux parties contribuent conjointement au projet avec partage des résultats.'
  },
  {
    id: 'participation',
    name: 'Participation',
    description: 'Engagement collectif où chaque participant contribue à la réussite du projet sans contrepartie monétaire.'
  },
  {
    id: 'association',
    name: 'Association',
    description: 'Regroupement de ressources et compétences pour atteindre un objectif commun en tant que partenaires.'
  },
  {
    id: 'partage-revenus',
    name: 'Partage de revenus',
    description: 'Les gains générés sont répartis entre les partenaires selon un pourcentage convenu d\'avance.'
  },
  {
    id: 'remuneration',
    name: 'Rémunération',
    description: 'Paiement en euros pour les services rendus ou le travail fourni selon un tarif établi.'
  },
  {
    id: 'echange',
    name: 'Échange de service',
    description: 'Troc de services où les deux parties s\'échangent leurs compétences sans transaction monétaire.'
  }
]

export const getPaymentOptionWithDescription = (optionId: string): PaymentOption | undefined => {
  return PAYMENT_OPTIONS_CONFIG.find(option => option.id === optionId)
}

export const filterPaymentOptionsByCategory = (
  categorySlug?: string | null
): PaymentOption[] => {
  // Par défaut, retourner toutes les options
  // Vous pouvez ajouter des filtres spécifiques par catégorie ici
  const categoryPaymentsMap: Record<string, string[]> = {
    emploi: ['remuneration'],
    services: ['remuneration', 'echange', 'co-creation']
  }

  const allowedIds = categoryPaymentsMap[categorySlug ?? '']
  if (!allowedIds) return PAYMENT_OPTIONS_CONFIG

  return PAYMENT_OPTIONS_CONFIG.filter(option => allowedIds.includes(option.id))
}
