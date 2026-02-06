// Test Scénario Publication Emploi
// Fichier: test-emploi-publication.ts

// Scénarios à tester:

export const testEmploiPublicationScenarios = {
  
  // Scénario 1: Publication emploi - Montage
  scenario1_emploi_montage: {
    category: 'emploi',
    subcategory: 'montage',
    title: 'Monteur Vidéo Recherché',
    description: 'Nous cherchons un monteur vidéo expérimenté pour nos projets de contenu.',
    contract_type: 'freelance',
    work_schedule: '20h/semaine, flexible',
    responsibilities: 'Monter et éditer des vidéos pour TikTok, Instagram Reels et YouTube Shorts',
    required_skills: 'Adobe Premiere Pro, After Effects, montage rapide',
    benefits: 'Horaires flexibles, possibilité télétravail, projets variés',
    location: 'Télétravail',
    deadline: '2026-02-15',
    exchange_type: 'remuneration', // Auto-sélectionné
    price: '15', // 15€/heure ou salaire
    images: ['url/to/image1.jpg'], // Au moins une
    status: 'active'
  },

  // Scénario 2: Publication emploi - Micro-trottoir
  scenario2_emploi_micro: {
    category: 'emploi',
    subcategory: 'micro-trottoir',
    title: 'Micro-trottoir Reporter - Paris',
    description: 'Recherche des reporters pour tournages de micro-trottoir en rue.',
    contract_type: 'cdd',
    work_schedule: '3 jours/semaine, weekend possible',
    responsibilities: 'Aborder les gens en rue, poser des questions, animer court interview',
    required_skills: 'Parlant public, empathie, dynamique',
    benefits: 'Produits gratuits à la clé, expérience vidéo, peu d\'expérience requise',
    location: 'Paris 11ème',
    deadline: '2026-02-20',
    exchange_type: 'remuneration',
    price: '12',
    images: ['url/to/image.jpg'],
    status: 'active'
  },

  // Scénario 3: Publication emploi - Live
  scenario3_emploi_live: {
    category: 'emploi',
    subcategory: 'live',
    title: 'Animateur(trice) Live - Marchandise en direct',
    description: 'Nous avons besoin d\'animateurs live pour nos sessions de vente directe sur Instagram Live.',
    contract_type: 'interim',
    work_schedule: 'Soirées 19h-23h, 3-4 fois/semaine',
    responsibilities: 'Animer live, valoriser produits, interagir avec audience, gérer chat',
    required_skills: 'Aisance à l\'oral, énergie, connaissance produits',
    benefits: 'Flexibilité, bonus selon performance, formation fournie',
    location: 'Télétravail (studio requis)',
    deadline: '2026-02-10',
    exchange_type: 'remuneration',
    price: '25',
    images: ['url/to/image.jpg'],
    status: 'active'
  },

  // Scénario 4: Publication emploi - Écriture contenu  
  scenario4_emploi_ecriture: {
    category: 'emploi',
    subcategory: 'ecriture-contenu',
    title: 'Rédacteur Contenu Instagram - Fitness',
    description: 'Besoin d\'un content writer pour nos posts Instagram dans le secteur fitness.',
    contract_type: 'cdi',
    work_schedule: '35h/semaine, lundi-vendredi 9h-17h',
    responsibilities: 'Rédiger posts engageant, concevoir copywriting, SEO social media',
    required_skills: 'Copywriting, connaissance fitness, tendances social media',
    benefits: 'CDI, salle de sport gratuite, tickets resto, évolution',
    location: 'Lyon',
    deadline: '2026-03-01',
    exchange_type: 'remuneration',
    price: '2200', // Salaire mensuel
    images: ['url/to/image.jpg'],
    status: 'active'
  }
}

// Points de Vérification:

export const validationChecklist = [
  // Avant publication
  {
    step: 'Avant Step 4 (Description)',
    checks: [
      'Catégorie "emploi" est sélectionnée',
      'Sous-catégorie est sélectionnée (montage, micro-trottoir, live, écriture-contenu)',
      'Aucune popup ou erreur n\'empêche progression'
    ]
  },
  
  // Step 4
  {
    step: 'Step 4 - Description',
    checks: [
      'Label affiche "Type de rémunération *" (pas "Moyen de paiement")',
      'Select de rémunération affiche "Rémunération" pré-sélectionné',
      'Select est disabled/readonly (une seule option)',
      'Champ "Type de contrat" est visible et obligatoire',
      'Champ "Salaire (€)" est visible et obligatoire',
      'Champs optionnels présents: Horaires, Missions, Compétences, Avantages',
      'Description du poste: textarea visible et obligatoire'
    ]
  },
  
  // Validation
  {
    step: 'Validation - Champs obligatoires',
    checks: [
      'Titre: rempli et valide',
      'Description du poste: rempli et valide',
      'Type de contrat: sélectionné',
      'Moyen de paiement: "Rémunération" auto-sélectionné',
      'Salaire: nombre > 0',
      'Bouton "Continuer" devient actif'
    ]
  },
  
  // Step 5
  {
    step: 'Step 5 - Localisation et Médias',
    checks: [
      'Localisation: lieu valide',
      'Date de besoin: sélectionnée',
      'Photo: au moins une téléchargée',
      'Tous les champs rouges marqués comme obligatoires sont remplis'
    ]
  },
  
  // Publication
  {
    step: 'Publication',
    checks: [
      'Bouton "Publier" permet clic',
      'Pas de message d\'erreur avant publication',
      'Message de succès après 2-3 secondes',
      'Redirection vers page annonce',
      'Annonce visible sur page /emploi'
    ]
  },
  
  // Base de données
  {
    step: 'Base de Données',
    checks: [
      'Colonnes posts.contract_type: valeur envoyée',
      'Colonnes posts.payment_type: "remuneration"',
      'Colonnes posts.price: valeur saisie',
      'Colonnes posts.work_schedule: remplie ou null',
      'Colonnes posts.responsibilities: remplie ou null',
      'Colonnes posts.required_skills: remplie ou null',
      'Colonnes posts.benefits: remplie ou null'
    ]
  }
]

// Erreurs connues à tester pour s'assurer qu'elles sont RÉSOLUES:

export const knownIssues = [
  {
    issue: 'Bouton Continuer désactivé indéfiniment',
    expectedFix: 'Corrigé - exchange_type maintenant visible et auto-sélectionné',
    testMethod: 'Remplir tous les champs, vérifier que bouton devient actif'
  },
  {
    issue: 'Moyen de paiement non visible pour emploi',
    expectedFix: 'Corrigé - UI visible pour toutes catégories',
    testMethod: 'Voir le select "Type de rémunération" dans Step 4'
  },
  {
    issue: 'Exchange_type vide lors de publication',
    expectedFix: 'Corrigé - Auto-sélection remuneration pour emploi',
    testMethod: 'Vérifier dans BDD que payment_type = "remuneration"'
  },
  {
    issue: 'Type de contrat non présent dans formulaire',
    expectedFix: 'Champ visible dans Step 4 pour emploi',
    testMethod: 'Sélectionner CDI, CDD, etc. et publier'
  }
]
