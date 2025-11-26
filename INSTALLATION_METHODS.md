# Méthodes d'Installation de la Base de Données

Trois méthodes sont disponibles pour installer la base de données Ollync :

## 📝 Méthode 1: SQL Editor (Recommandé)

**La plus simple et la plus fiable**

```bash
npm run install-db:editor
```

Cette commande affiche le contenu du fichier SQL que vous pouvez copier-coller dans le SQL Editor de Supabase.

**Étapes :**
1. Exécutez la commande ci-dessus
2. Copiez tout le SQL affiché
3. Ouvrez : https://supabase.com/dashboard/project/abmtxvyycslskmnmlniq/sql/new
4. Collez le SQL dans l'éditeur
5. Cliquez sur "Run" ou appuyez sur Cmd/Ctrl + Enter

---

## 🔧 Méthode 2: Via psql (Ligne de commande)

**Exécution automatique via PostgreSQL**

```bash
npm run install-db:psql
```

Cette commande exécute le SQL directement via `psql`.

**Prérequis :**
- PostgreSQL installé (`brew install postgresql` sur macOS)
- Mot de passe de la base de données Supabase

**Où trouver le mot de passe :**
- Supabase Dashboard > Settings > Database > Database password

**Note :** Le script vous demandera le mot de passe de manière sécurisée.

---

## 🤖 Méthode 3: Tentative automatique via API

**Essaie d'exécuter via l'API Supabase**

```bash
export SUPABASE_SERVICE_ROLE_KEY="votre-clé-service-role"
npm run install-db:api
```

**Prérequis :**
- Clé service_role de Supabase

**Où trouver la clé service_role :**
- Supabase Dashboard > Settings > API > service_role key (secret)

**Note :** Cette méthode peut ne pas fonctionner car Supabase ne permet pas l'exécution SQL arbitraire via REST API standard. Utilisez la méthode 1 ou 2 si cela échoue.

---

## 🚀 Installation Interactive

Pour choisir une méthode interactivement :

```bash
npm run install-db
```

Cette commande vous proposera les trois méthodes et vous guidera dans le processus.

---

## 📁 Fichiers SQL

Le fichier SQL complet se trouve dans :
- `supabase/INSTALLATION_COMPLETE.sql`

Ce fichier contient toutes les tables, colonnes, triggers, fonctions et policies nécessaires pour l'application Ollync.

