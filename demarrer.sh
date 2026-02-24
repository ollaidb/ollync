#!/bin/bash
# Script pour démarrer l'application sans blocage de port

cd "$(dirname "$0")"

echo "Libération du port 3000..."
killall -9 node 2>/dev/null || true
sleep 2

echo "Démarrage du serveur..."
echo ""
echo "► Utilisez ce lien : http://localhost:3000"
echo "► Page Messages  : http://localhost:3000/messages"
echo "► Rafraîchir (voir les modifs) : Cmd+Shift+R"
echo ""

npm run dev
