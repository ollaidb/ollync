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
    description: 'Collaboration créative où les résultats sont partagés.'
  },
  {
    id: 'participation',
    name: 'Participation',
    description: 'Parce que tu as envie de vivre une belle expérience!'
  },
  {
    id: 'association',
    name: 'Association',
    description: 'Regroupement de ressources et compétences pour un objectif commun.'
  },
  {
    id: 'partage-revenus',
    name: 'Partage de revenus',
    description: 'Selon les gains générés par le contenu.'
  },
  {
    id: 'remuneration',
    name: 'Rémunération',
    description: 'Liquide, virement, paypal, wero avant ou après le service.'
  },
  {
    id: 'echange',
    name: 'Échange de service',
    description: 'Partage d’expertise et/ou de compétences'
  },
  {
    id: 'visibilite-contre-service',
    name: 'Visibilité contre service',
    description: 'Accord préalable sur une mention, un crédit ou une publicité en échange du service.'
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
    services: ['remuneration', 'echange', 'co-creation'],
    'poste-service': ['remuneration', 'visibilite-contre-service']
  }

  const allowedIds = categoryPaymentsMap[categorySlug ?? '']
  if (!allowedIds) return PAYMENT_OPTIONS_CONFIG

  return PAYMENT_OPTIONS_CONFIG.filter(option => allowedIds.includes(option.id))
}
