# Logique de Répartition des Match Requests

## Vue d'ensemble

Ce document clarifie la répartition des `match_requests` entre les pages **Messages** et **Notifications**.

## Page Messages

### Menu "Demandes" (`match_requests`)
- **Affiche** : Uniquement les demandes **ENVOYÉES** par l'utilisateur actuel
- **Filtre** : `from_user_id = current_user` ET `status = 'pending'`
- **Action** : L'utilisateur peut voir l'état de ses demandes envoyées et les annuler si nécessaire

### Menu "Matchs" (`matches`)
- **Affiche** : Uniquement les matchs **ACCEPTÉS** (demandes qu'on a envoyées et qui ont été acceptées)
- **Filtre** : `from_user_id = current_user` ET `status = 'accepted'`
- **Action** : L'utilisateur peut démarrer une conversation avec le match accepté

## Page Notifications

### Notification `match_request_received`
- **Déclencheur** : Quand quelqu'un envoie une demande à l'utilisateur actuel
- **Filtre** : `to_user_id = current_user` ET `status = 'pending'`
- **Action** : L'utilisateur peut **accepter** ou **refuser** la demande depuis les notifications
- **Redirection** : Vers Messages > Demandes (pour voir les détails)

### Notification `match_request_accepted`
- **Déclencheur** : Quand quelqu'un accepte une demande qu'on a envoyée
- **Filtre** : `from_user_id = current_user` ET `status = 'accepted'`
- **Action** : Informe l'utilisateur que sa demande a été acceptée
- **Redirection** : Vers Messages > Matchs (pour voir le match accepté)

### Notification `match_request_declined`
- **Déclencheur** : Quand quelqu'un refuse une demande qu'on a envoyée
- **Filtre** : `from_user_id = current_user` ET `status = 'declined'`
- **Action** : Informe discrètement l'utilisateur que sa demande a été refusée

## Flux Utilisateur

### Scénario 1 : Envoyer une demande
1. Utilisateur A envoie une demande à Utilisateur B
2. **Messages** (A) : La demande apparaît dans "Demandes" avec status='pending'
3. **Notifications** (B) : B reçoit une notification `match_request_received`
4. B peut accepter/refuser depuis les Notifications

### Scénario 2 : Accepter une demande reçue
1. Utilisateur B accepte la demande de A
2. **Notifications** (A) : A reçoit une notification `match_request_accepted`
3. **Messages** (A) : Le match apparaît dans "Matchs" avec status='accepted'
4. **Messages** (B) : Le match apparaît aussi dans "Matchs" (si B a aussi envoyé une demande)

### Scénario 3 : Refuser une demande reçue
1. Utilisateur B refuse la demande de A
2. **Notifications** (A) : A reçoit une notification `match_request_declined` (discrète)
3. **Messages** (A) : La demande disparaît de "Demandes" (status='declined')

## Base de Données

### Table `match_requests`
```sql
- from_user_id : L'utilisateur qui a envoyé la demande
- to_user_id : L'utilisateur qui a reçu la demande
- status : 'pending', 'accepted', 'declined', 'cancelled'
- related_post_id : L'annonce liée à la demande
```

### Notifications créées automatiquement
- `match_request_sent` : Créée pour `from_user_id` (confirmation)
- `match_request_received` : Créée pour `to_user_id` (demande reçue)
- `match_request_accepted` : Créée pour `from_user_id` ET `to_user_id` (acceptation)
- `match_request_declined` : Créée pour `from_user_id` (refus)

## Code

### Messages.tsx
- `loadMatchRequests()` : Charge uniquement `from_user_id = current_user`
- `filteredMatchRequests` : Filtre `status = 'pending'` ET `request_type = 'sent'`
- `filteredMatches` : Filtre `status = 'accepted'` ET `request_type = 'sent'`

### Notifications.tsx
- Filtre "Match" : Affiche `match_request_accepted`, `match_request_received`, `match_request_sent`
- Navigation : Redirige vers Messages avec le bon filtre selon le type de notification

## Points Importants

1. **Messages** = Demandes **envoyées** et matchs **acceptés** (qu'on a initiés)
2. **Notifications** = Demandes **reçues** et **acceptations** de nos demandes
3. Les demandes reçues sont gérées dans **Notifications** (accepter/refuser)
4. Les demandes envoyées sont visibles dans **Messages** (suivre l'état)

