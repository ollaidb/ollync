#!/bin/bash

# Script d'installation automatique avec psql
# Ce script nécessite que psql soit installé et que vous ayez le mot de passe de la base de données

echo "🚀 Installation automatique de la base de données Ollync"
echo ""

# Configuration
SUPABASE_URL="abmtxvyycslskmnmlniq.supabase.co"
SQL_FILE="supabase/INSTALLATION_COMPLETE.sql"

# Demander le mot de passe de la base de données
# Peut être fourni via variable d'environnement ou argument en ligne de commande
if [ -z "$DB_PASSWORD" ]; then
    if [ -n "$1" ]; then
        DB_PASSWORD="$1"
    else
        echo "📝 Entrez le mot de passe de votre base de données Supabase:"
        echo "   (Vous pouvez le trouver dans: Supabase Dashboard > Settings > Database)"
        echo "   Ou utilisez: DB_PASSWORD='votre-mot-de-passe' ./scripts/install-with-psql.sh"
        read -s DB_PASSWORD
        echo ""
    fi
fi

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Mot de passe requis!"
    echo "   Utilisez: DB_PASSWORD='votre-mot-de-passe' ./scripts/install-with-psql.sh"
    exit 1
fi

# Construire l'URL de connexion (connexion directe pour les scripts SQL)
# Format: postgresql://postgres@db.[PROJECT_REF].supabase.co:5432/postgres
DB_URL="postgresql://postgres@db.${SUPABASE_URL}:5432/postgres"

# Vérifier que psql est installé
if ! command -v psql &> /dev/null; then
    echo "❌ psql n'est pas installé"
    echo "📝 Installez PostgreSQL pour utiliser psql:"
    echo "   - macOS: brew install postgresql"
    echo "   - Linux: sudo apt-get install postgresql-client"
    echo "   - Windows: Téléchargez depuis https://www.postgresql.org/download/"
    exit 1
fi

# Vérifier que le fichier SQL existe
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Fichier non trouvé: $SQL_FILE"
    exit 1
fi

echo "📖 Exécution du script SQL..."
echo ""

# Exporter le mot de passe comme variable d'environnement pour psql
export PGPASSWORD="$DB_PASSWORD"

# Exécuter le script SQL
psql "$DB_URL" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation terminée avec succès!"
else
    echo ""
    echo "❌ Erreur lors de l'installation"
    exit 1
fi

