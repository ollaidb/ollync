# Guide d'Installation - Fonctionnalités de Messagerie

Ce guide explique comment activer les trois boutons de messagerie : **Médias**, **Annonce**, et **Rendez-vous**.

## 📋 Prérequis

- Accès à votre projet Supabase
- SQL Editor dans Supabase Dashboard

## 🚀 Installation

### Étape 1 : Exécuter le script SQL

1. Ouvrez votre **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier `fix_messaging_features_complete.sql`
5. Cliquez sur **Run** pour exécuter le script

Le script va :
- ✅ Ajouter les colonnes nécessaires à la table `messages`
- ✅ Créer la table `appointments` pour les rendez-vous
- ✅ Configurer les politiques RLS (Row Level Security)
- ✅ Créer les triggers pour les notifications automatiques

### Étape 2 : Créer les buckets de stockage

Les buckets sont nécessaires pour stocker les photos, vidéos et documents.

1. Dans Supabase Dashboard, allez dans **Storage**
2. Cliquez sur **New bucket**

#### Bucket 1 : `posts` (pour les photos)
- **Name** : `posts`
- **Public bucket** : ✅ Oui
- **File size limit** : 50 MB (ou selon vos besoins)
- **Allowed MIME types** : `image/*`

#### Bucket 2 : `videos` (pour les vidéos)
- **Name** : `videos`
- **Public bucket** : ✅ Oui
- **File size limit** : 100 MB (ou selon vos besoins)
- **Allowed MIME types** : `video/*`

#### Bucket 3 : `documents` (pour les documents)
- **Name** : `documents`
- **Public bucket** : ✅ Oui
- **File size limit** : 50 MB (ou selon vos besoins)
- **Allowed MIME types** : 
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `text/plain`

### Étape 3 : Configurer les politiques de stockage

Pour chaque bucket créé, configurez les politiques :

1. Allez dans **Storage** > **Policies**
2. Pour chaque bucket, créez une politique :

**Politique d'upload (INSERT)** :
```sql
CREATE POLICY "Users can upload files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'posts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Politique de lecture (SELECT)** :
```sql
CREATE POLICY "Public can view files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posts');
```

Répétez pour `videos` et `documents` en remplaçant `'posts'` par le nom du bucket.

## ✅ Vérification

Après l'installation, vérifiez que :

1. ✅ Les colonnes existent dans la table `messages` :
   - `message_type`
   - `file_url`
   - `file_name`
   - `file_size`
   - `file_type`
   - `shared_post_id`
   - `calendar_request_data`

2. ✅ La table `appointments` existe

3. ✅ Les buckets de stockage existent :
   - `posts`
   - `videos`
   - `documents`

4. ✅ Les politiques RLS sont actives

## 🎯 Fonctionnalités

### 1. Médias (Photo, Vidéo, Document)

- **Photo** : Envoi d'images via le bucket `posts`
- **Vidéo** : Envoi de vidéos via le bucket `videos` (max 10 secondes)
- **Document** : Envoi de documents via le bucket `documents`

### 2. Annonce

- Permet de partager une annonce existante dans une conversation
- L'annonce est stockée dans `shared_post_id`

### 3. Rendez-vous

- Permet de créer un rendez-vous avec date et heure
- Crée automatiquement une entrée dans la table `appointments`
- Envoie des notifications automatiques :
  - 1 jour avant le rendez-vous (à 9h)
  - Le jour du rendez-vous (à 8h)

## 🔧 Dépannage

### Les messages ne s'envoient pas

1. Vérifiez les logs dans la console du navigateur
2. Vérifiez que les colonnes existent dans la table `messages`
3. Vérifiez les politiques RLS

### Les fichiers ne s'uploadent pas

1. Vérifiez que les buckets existent
2. Vérifiez les politiques de stockage
3. Vérifiez les limites de taille de fichier

### Les rendez-vous ne se créent pas

1. Vérifiez que la table `appointments` existe
2. Vérifiez les politiques RLS pour `appointments`
3. Vérifiez les logs dans la console

## 📝 Notes

- Les vidéos sont limitées à 10 secondes maximum
- Les notifications de rendez-vous sont créées automatiquement via des triggers
- Les buckets doivent être publics pour que les fichiers soient accessibles
