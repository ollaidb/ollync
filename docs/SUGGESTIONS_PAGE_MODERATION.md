# Suggestions – Page Modération (Connexion et sécurité)

**État : modifications réalisées.** Ce document garde la trace des choix effectués.

---

## 1. Correction « page pas cliquable »

**Problème identifié :** La route `/profile/security/moderation` n’existe pas dans `App.tsx`. Seules les routes `account-security`, `password`, `phone`, `two-factor`, `devices`, `blocked-profiles` sont définies. Donc en cliquant sur « Modération », l’URL change mais aucune route ne correspond et la page ne s’affiche pas.

**À faire :**
- Ajouter dans `App.tsx` :  
  `<Route path="/profile/security/moderation" element={<Profile />} />`  
  (au même endroit que les autres routes `profile/security/...`).

**Résultat attendu :** Le lien « Modération » dans Connexion et sécurité ouvre bien la page de modération.

---

## 2. Vue d’ensemble avant modifications (en haut de page)

- **Nombre d’utilisateurs** dans l’application (count sur `profiles`).
- À afficher en haut de la page, avant les chiffres actuels (Profils signalés, Annonces signalées, En attente), pour avoir le contexte global.

---

## 3. Menu dans la page Modération

Actuellement : onglets « Profils / Annonces / Tous » + filtre « En attente / Tout ».

**Proposition de menu (sidebar ou onglets principaux) :**
- **Tableau de bord** : vue d’ensemble (stats + règles, voir ci‑dessous).
- **Signalements** : liste actuelle (profils signalés, annonces signalées, actions).
- **Statistiques** : toutes les stats détaillées (utilisateurs, annonces, activité, etc.).
- **Activité suspecte** (optionnel) : liste des entrées `suspicious_activity` (contenus flagués par la modération automatique).
- **Règles et procédures** : bloc fixe ou page dédiée avec les règles (voir point 4).

Tu valides ce menu ou tu en enlèves/ajoutes des entrées ?

---

## 4. Règles et procédures (affichage pour le modérateur)

Bloc ou section « Comment ça se passe » avec :

- **Signalement reçu** : un utilisateur signale un profil ou une annonce (depuis l’app).
- **Accès modérateur** : vous voyez la liste des signalements (profils / annonces), avec auteur du signalement, profil ou annonce signalé(e), raison, description.
- **Vérification** : vous pouvez « Voir profil signalé », « Voir annonce », « Voir messages avec signalé / auteur / conversation entre eux ».
- **Décision** :
  - Si **suspect** : possibilité de **supprimer définitivement** le profil ou l’annonce (avec confirmation). Les actions existantes « Supprimer profil » et « Supprimer annonce » restent.
  - Sinon : **Marquer examiné**, **Résolu**, ou **Ignorer** (statut du signalement).
- **Un seul compte** a accès à cette page (ex. binta22116@gmail.com) ; le reste voit « Accès refusé ». À laisser tel quel.

Souhaites-tu ce bloc en haut de la page (sous les stats), dans un onglet « Règles », ou les deux ?

---

## 5. Statistiques à afficher

À mettre dans une section/onglet « Statistiques » (avec le menu ci‑dessus).

**Proposition :**

| Statistique | Description |
|------------|-------------|
| **Nombre d’utilisateurs** | Total des profils (count `profiles`). |
| **Annonces publiées** | Total des posts (tous statuts ou seulement `active` – à préciser). |
| **Annonces par jour** | Nombre d’annonces créées par jour (sur les 7, 30 derniers jours par exemple). |
| **Ancienneté des utilisateurs** | Répartition ou moyenne : durée depuis `created_at` (ex. « &lt; 1 mois », « 1–6 mois », « &gt; 6 mois »). |
| **Annonces par utilisateur** | Moyenne (ou distribution) du nombre d’annonces par profil. |
| **Signalements en attente** | Déjà présent ; à garder. |
| **Contenus flagués (auto)** | Nombre de posts avec `moderation_status = 'flagged'` (et éventuellement messages flagués). |

**À valider :**
- Lesquelles tu veux en priorité.
- Période par défaut (7 j, 30 j) pour « annonces par jour » et éventuellement pour d’autres indicateurs.

---

## 6. Autres idées pour le modérateur (amélioration de l’app)

- **Liste des comptes les plus signalés** : utilisateurs avec le plus de signalements (profils ou annonces), pour cibler les revues.
- **Liste des comptes avec activité suspecte** : utilisateurs ayant au moins une entrée dans `suspicious_activity` (contenu fraude/NSFW auto‑flagué).
- **Messages flagués** : liste des messages avec `moderation_status = 'flagged'` (optionnel : lien vers la conversation, raison).
- **Export simple** : bouton « Export CSV » des signalements (date, type, raison, statut, IDs) pour archivage ou analyse.
- **Historique des actions modérateur** (optionnel, plus lourd) : table « actions_moderation » (qui a supprimé quel profil/annonce, quand) pour traçabilité.
- **Mots-clés de modération** : lecture seule (ou lien) de la liste `moderation_keywords` pour rappel des règles auto.
- **Alertes** : si nombre de signalements en attente &gt; X, afficher un bandeau « X signalements en attente » (X à définir).

Dis-moi lesquelles tu retiens (et si tu veux d’autres stats ou outils).

---

## 7. Récapitulatif à valider

1. **Correction lien** : ajout de la route `/profile/security/moderation` dans `App.tsx`.  
2. **Vue d’ensemble** : afficher le **nombre d’utilisateurs** en haut de la page modération.  
3. **Menu** : Tableau de bord / Signalements / Statistiques / (Activité suspecte) / (Règles). Oui / non / à adapter ?  
4. **Règles** : bloc « Comment ça se passe » (signalement → accès → vérification → suppression ou résolution). Où ? (haut de page, onglet, ou les deux.)  
5. **Statistiques** : nombre d’utilisateurs, annonces publiées, annonces par jour, ancienneté, annonces par utilisateur, contenus flagués. Lesquelles garder / ajouter ?  
6. **Autres** : comptes les plus signalés, activité suspecte, messages flagués, export CSV, historique des actions, mots-clés, alertes. Lesquelles tu veux en priorité ?

---

## Scripts SQL à exécuter (si pas déjà fait)

1. **`supabase/fraud_and_content_moderation.sql`** – Tables modération (mots-clés, activité suspecte). Nécessaire pour l’onglet « Activité suspecte ».
2. **`supabase/moderation_stats_and_moderator_profiles.sql`** – Politique « Moderator can view all profiles » et fonction **`get_moderation_stats()`**. Nécessaire pour le tableau de bord (nombre d’utilisateurs) et l’onglet « Statistiques ».

Exécuter les deux dans l’ordre dans le SQL Editor Supabase.
