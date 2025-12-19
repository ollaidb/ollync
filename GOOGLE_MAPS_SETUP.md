# Configuration Google Maps

## Obtenir une clé API Google Maps

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API "Maps JavaScript API" :
   - Dans le menu, allez dans "APIs & Services" > "Library"
   - Recherchez "Maps JavaScript API"
   - Cliquez sur "Enable"
4. Créez une clé API :
   - Allez dans "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "API Key"
   - Copiez votre clé API
5. (Recommandé) Restreignez votre clé API :
   - Cliquez sur la clé créée pour l'éditer
   - Dans "Application restrictions", sélectionnez "HTTP referrers"
   - Ajoutez votre domaine (ex: `localhost:5173/*`, `votre-domaine.com/*`)
   - Dans "API restrictions", sélectionnez "Restrict key" et choisissez "Maps JavaScript API"

## Configuration dans l'application

1. Créez un fichier `.env` à la racine du projet
2. Ajoutez votre clé API :

```env
VITE_GOOGLE_MAPS_API_KEY=votre_cle_api_ici
```

3. Redémarrez le serveur de développement si nécessaire

## Utilisation

Le composant `GoogleMapComponent` est maintenant disponible et utilisé dans :
- `PostDetails.tsx` : Affiche la carte avec la localisation du post

### Exemple d'utilisation

```tsx
import { GoogleMapComponent } from '../components/Maps/GoogleMap'

<GoogleMapComponent
  lat={48.8566}
  lng={2.3522}
  address="Paris, France"
  height="400px"
  zoom={15}
  markerTitle="Localisation"
  onMarkerClick={() => console.log('Marker clicked')}
/>
```

## Notes importantes

- La clé API est publique côté client (préfixe `VITE_`)
- Assurez-vous de restreindre votre clé API aux domaines autorisés
- Google Maps propose un crédit gratuit mensuel (voir [tarification](https://mapsplatform.google.com/pricing/))

