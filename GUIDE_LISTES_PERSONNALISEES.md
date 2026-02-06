# Listes Personnalisées - Guide Complet

## Vue d'ensemble

Ce projet utilise maintenant des **listes personnalisées conformes à l'application** au lieu des listes HTML natives (UL/OL) qui utilisaient les styles par défaut d'Apple.

## Composants disponibles

### 1. **CustomList** - Listes interactives avec sélection

Utilisé pour les sélections comme les moyens de paiement et les réseaux sociaux.

```tsx
import { CustomList } from '@/components/CustomList'

const paymentOptions = [
  { 
    id: 'remuneration',
    name: 'Rémunération',
    description: 'Paiement en euros pour les services rendus'
  },
  {
    id: 'echange',
    name: 'Échange de service',
    description: 'Troc de services sans transaction monétaire'
  }
]

<CustomList
  items={paymentOptions}
  selectedId={selectedPayment}
  onSelectItem={(id) => setSelectedPayment(id)}
  className="payment-list"
/>
```

**Props:**
- `items`: Array of ListItem objects with id, name, and optional description
- `selectedId`: Current selected item ID
- `onSelectItem`: Callback when item is selected
- `className`: Optional CSS class for styling

### 2. **BulletList** - Listes à puces

Pour les listes d'informations simples avec puces.

```tsx
import { BulletList } from '@/components/CustomList'

<BulletList
  items={[
    'Vérifier le profil de l\'utilisateur',
    'Demander des preuves concrètes',
    'Faire un appel vidéo avant la rencontre'
  ]}
/>
```

Avec descriptions :

```tsx
<BulletList
  items={[
    {
      text: 'Sécurité d\'abord',
      description: 'Toujours vérifier les intentions de l\'utilisateur'
    },
    {
      text: 'Transparence',
      description: 'Demander des détails précis sur le service'
    }
  ]}
/>
```

**Props:**
- `items`: Array of strings or ListItemContent objects
- `className`: Optional CSS class

### 3. **NumberedList** - Listes numérotées

Pour les étapes ou les instructions numérotées.

```tsx
import { NumberedList } from '@/components/CustomList'

<NumberedList
  items={[
    'Créer votre compte',
    'Compléter votre profil',
    'Publier votre première annonce',
    'Gérer vos messages'
  ]}
/>
```

## Fichiers modifiés

### Moyens de paiement & Réseaux sociaux (Step4Description.tsx)
- ✅ Remplacé `<select>` natif par `CustomList` pour les moyens de paiement (avec explications)
- ✅ Remplacé `<select>` natif par `CustomList` pour les réseaux sociaux (sans explication)

### Messages de sécurité (Messages.css)
- ✅ Modernisé les listes dans les avertissements sur les arnaques

### Pages de conditions (Auth.css)
- ✅ Remplacé les listes HTML natives par des listes stylisées personnalisées

### Pages légales (LegalPage.css)
- ✅ Remplacé les listes HTML natives avec support des listes à puces et numérotées

### Guide de publication (PublishGuideModal.css)
- ✅ Modernisé les listes dans le modal de guide

## Style des listes

### Colors & Variables CSS utilisées:
```css
- --primary: Couleur primaire pour les points/numéros
- --foreground: Texte principal
- --muted-foreground: Texte grisé pour descriptions
- --border: Bordures
- --input: Fond des entrées
- --card: Fond des cartes
```

### Classes CSS disponibles:
```css
.custom-bullet-list        /* Conteneur de listes à puces */
.custom-bullet-item        /* Élément de la liste */
.custom-bullet-point       /* Point (•) */
.custom-bullet-content     /* Contenu textuel */
.custom-bullet-text        /* Texte principal */
.custom-bullet-description /* Description optionnelle */

.custom-numbered-list      /* Conteneur de listes numérotées */
.custom-numbered-item      /* Élément numéroté */
.custom-numbered-point     /* Numéro en cercle */
.custom-numbered-content   /* Contenu textuel */
.custom-numbered-text      /* Texte principal */
.custom-numbered-description /* Description optionnelle */

.custom-list               /* Conteneur de listes d'options */
.custom-list-item          /* Option sélectionnable */
.custom-list-item-checkbox /* Case à cocher */
.custom-list-item-content  /* Contenu de l'option */
.custom-list-item-name     /* Nom de l'option */
.custom-list-item-description /* Description de l'option */
```

## Configuration des données

### Moyens de paiement
Fichier: `src/utils/paymentOptions.ts`
- Liste complète avec descriptions pour chaque moyen de paiement
- `PAYMENT_OPTIONS_CONFIG`: Array de PaymentOption
- Fonction `filterPaymentOptionsByCategory()` pour les filtrer par catégorie

### Réseaux sociaux
Fichier: `src/utils/socialNetworks.ts`
- Liste simple des réseaux sans descriptions (comme demandé)
- `SOCIAL_NETWORKS_CONFIG`: Array de SocialNetworkOption

## Responsive Design

Toutes les listes s'adaptent automatiquement aux écrans mobiles:
- Gaps réduits sur mobile
- Tailles de font ajustées
- Espacement optimisé pour touch

## Mise à jour future

Pour ajouter une nouvelle liste personalisée:

1. Importez le composant approprié (CustomList, BulletList, ou NumberedList)
2. Définissez vos données (Array d'objets ou de strings)
3. Remplacez `<ul>/<ol>` et `<li>` par le composant
4. Ajustez les styles si nécessaire via les classes CSS

Exemple:
```tsx
// Avant (HTML natif)
<ul>
  <li>Élément 1</li>
  <li>Élément 2</li>
</ul>

// Après (Composant personnalisé)
<BulletList items={['Élément 1', 'Élément 2']} />
```

## Avantages

✅ **Cohérence visuelle**: Toutes les listes suivent le même design
✅ **Accessibilité**: Meilleure navigation au clavier
✅ **Flexibilité**: Support des descriptions et des sélections
✅ **Performance**: Composants légers et optimisés
✅ **Responsive**: Fonctionne parfaitement sur tous les appareils
✅ **Brand consistency**: Conforme à l'identité visuelle de l'application
