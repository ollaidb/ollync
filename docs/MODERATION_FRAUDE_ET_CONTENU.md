# Modération fraude, arnaque et contenu inapproprié

Ce document décrit le système de protection contre la fraude, les arnaques et le contenu inapproprié (dont NSFW/pornographique).

## Ce qui est en place

### 1. Base de données (Supabase)

- **Table `moderation_keywords`**  
  Liste de mots-clés par catégorie : `fraud`, `nsfw`, `spam`, `scam`, `phishing`.  
  Chaque mot a une sévérité (1–3). Vous pouvez ajouter ou désactiver des mots sans toucher au code.

- **Table `suspicious_activity`**  
  Enregistrement des comportements suspects (ex. contenu d’un post flagué).  
  Utilisable pour analyser les comptes à risque et protéger les utilisateurs.

- **Fonction SQL `check_moderation_text(input_text)`**  
  Prend un texte et retourne un score + une liste de raisons (ex. `fraud:arnaque`, `nsfw:porno`).  
  Utilisée par l’app pour les posts et les messages.

- **Colonnes sur `posts`**  
  `moderation_status` (`clean` / `flagged`), `moderation_reason`, `moderation_score`, `moderated_at`.

- **Colonnes sur `messages`**  
  `moderation_status`, `moderation_reason` pour marquer les messages à contrôler.

**Script à exécuter une fois dans le SQL Editor Supabase :**  
`supabase/fraud_and_content_moderation.sql`

### 2. Application (texte)

- **Publication d’annonces**  
  Avant insertion, le titre, la description et d’autres champs texte sont analysés avec :
  - la modération existante (insultes, nudité, contenu pédophile) ;
  - la liste de mots-clés en base (fraude, arnaque, NSFW, spam).  
  Si le contenu est flagué : `moderation_status = 'flagged'`, score et raisons enregistrés, et une entrée est créée dans `suspicious_activity` pour l’auteur.

- **Envoi de messages**  
  Le contenu des messages texte est vérifié avec les mêmes mots-clés.  
  Si détection : le message est tout de même enregistré mais avec `moderation_status = 'flagged'` et `moderation_reason` pour revue par un modérateur.

### 3. Comportements suspects

- Chaque fois qu’un **post** est marqué comme flagué (modération texte), une ligne est ajoutée dans `suspicious_activity` (type `content_flagged`, lien vers le post).  
- Vous pouvez ensuite :
  - consulter les activités par utilisateur ;
  - détecter les comptes qui accumulent des contenus flagués ;
  - ajouter d’autres types d’activité (ex. volume de publications anormal) via des jobs ou Edge Functions.

## Modération des images (à mettre en place)

La détection de **contenu inapproprié ou pornographique dans les images** ne peut pas se faire uniquement en base : il faut un service d’analyse d’images.

### Options possibles

1. **Google Cloud Vision API – Safe Search**  
   Détection de contenu adulte / violent.  
   À appeler depuis une **Supabase Edge Function** ou un petit backend après upload (posts, messages, groupe).

2. **AWS Rekognition – Content Moderation**  
   Même idée : analyse d’image, score adulte / violent, à utiliser côté serveur ou Edge Function.

3. **Sightengine, etc.**  
   APIs tierces dédiées à la modération d’images (NSFW, violence).

### Mise en œuvre recommandée

1. Créer une **Edge Function** Supabase déclenchée après upload dans le bucket (ex. `posts`) :
   - récupérer l’URL ou le fichier ;
   - appeler l’API choisie (Vision, Rekognition, Sightengine) ;
   - selon le score :
     - soit marquer l’image (métadonnées ou table dédiée) ;
     - soit mettre à jour le post (ex. `moderation_status = 'flagged'`, `moderation_reason` incluant `image_nsfw`) ;
     - et éventuellement créer une entrée dans `suspicious_activity`.

2. Pour les **messages** avec photo : même principe (bucket dédié aux pièces jointes, puis même Edge Function ou une dédiée messages).

3. Ne pas stocker de clés API (Vision, Rekognition, etc.) dans le front : tout doit passer par Edge Function ou backend.

## Résumé

| Élément              | Où c’est fait                         |
|----------------------|----------------------------------------|
| Mots (fraude, NSFW)  | Base : `moderation_keywords` + `check_moderation_text` |
| Analyse texte posts | App : `publishHelpers` + `moderation.ts` |
| Analyse texte messages | App : `MessageInput` + `moderation.ts` |
| Comportements suspects | Base : `suspicious_activity` + log depuis l’app |
| Images / NSFW        | À faire : Edge Function + API (Vision, Rekognition, etc.) |

En exécutant `supabase/fraud_and_content_moderation.sql` et en déployant le code actuel, la détection sur le **texte** (fraude, arnaque, contenu inapproprié) et l’enregistrement des **comportements suspects** sont opérationnels. La modération des **images** reste à brancher sur une API externe via une Edge Function.
