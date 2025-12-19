import { useMemo } from 'react'
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'
import './GoogleMap.css'

interface GoogleMapProps {
  lat: number
  lng: number
  address?: string | null
  height?: string
  zoom?: number
  markerTitle?: string
  onMarkerClick?: () => void
}

const libraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places']

export const GoogleMapComponent = ({
  lat,
  lng,
  address,
  height = '400px',
  zoom = 15,
  markerTitle,
  onMarkerClick
}: GoogleMapProps) => {
  // Récupération de la clé API depuis les variables d'environnement
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    return (
      <div className="google-map-error" style={{ height }}>
        <p>⚠️ Clé API Google Maps non configurée</p>
        <p className="error-detail">
          Veuillez configurer VITE_GOOGLE_MAPS_API_KEY dans votre fichier .env
          <br />
          Consultez GOOGLE_MAPS_SETUP.md pour plus d'informations
        </p>
      </div>
    )
  }

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries
  })

  const center = useMemo(() => ({ lat, lng }), [lat, lng])

  if (loadError) {
    return (
      <div className="google-map-error" style={{ height }}>
        <p>Erreur lors du chargement de Google Maps</p>
        <p className="error-detail">{loadError.message}</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="google-map-loading" style={{ height }}>
        <p>Chargement de la carte...</p>
      </div>
    )
  }

  return (
    <div className="google-map-container" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={zoom}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true
        }}
      >
        <Marker
          position={center}
          title={markerTitle || address || `${lat}, ${lng}`}
          onClick={onMarkerClick}
        />
      </GoogleMap>
    </div>
  )
}

