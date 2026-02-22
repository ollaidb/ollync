import { useState, useEffect, useRef } from 'react'
import { Loader, X, Search } from 'lucide-react'
import { isGoogleMapsReady, loadGoogleMapsScript } from '../../utils/loadGoogleMapsScript'
import './LocationAutocomplete.css'

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect: (location: {
    address: string
    lat: number
    lng: number
    city?: string
  }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const GooglePlacesAutocomplete = ({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Rechercher une adresse...',
  className = '',
  disabled = false
}: GooglePlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const isInitializedRef = useRef(false)
  const [inputValue, setInputValue] = useState(value)
  const [isLoaded, setIsLoaded] = useState(isGoogleMapsReady())
  const [loadError, setLoadError] = useState<Error | null>(null)

  // Récupération de la clé API depuis les variables d'environnement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY
  const isMissingGoogleKey =
    !apiKey || apiKey === 'YOUR_API_KEY' || apiKey === 'votre_clé_api_google_maps_ici'

  const isGoogleReady = isLoaded || isGoogleMapsReady()

  useEffect(() => {
    if (isMissingGoogleKey) return
    if (isGoogleMapsReady()) {
      setIsLoaded(true)
      setLoadError(null)
      return
    }

    let cancelled = false
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled) return
        setIsLoaded(true)
        setLoadError(null)
      })
      .catch((error) => {
        if (cancelled) return
        setLoadError(error instanceof Error ? error : new Error('Erreur chargement Google Maps'))
      })

    return () => {
      cancelled = true
    }
  }, [apiKey, isMissingGoogleKey])

  // Initialiser l'autocomplete quand Google Maps est chargé
  useEffect(() => {
    if (!isGoogleReady || !inputRef.current || loadError || isInitializedRef.current) return

    const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      // Recherche mondiale activée - pas de restriction géographique
      fields: ['formatted_address', 'geometry', 'address_components']
    })

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace()
      
      if (!place.geometry || !place.geometry.location) {
        console.error('Place details not available')
        return
      }

      const address = place.formatted_address || ''
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      
      // Extraire la ville depuis les composants d'adresse
      let city = ''
      if (place.address_components) {
        const cityComponent = place.address_components.find(
          component => component.types.includes('locality')
        ) || place.address_components.find(
          component => component.types.includes('administrative_area_level_2')
        )
        city = cityComponent?.long_name || ''
      }

      setInputValue(address)
      onChange(address)
      onLocationSelect({
        address,
        lat,
        lng,
        city
      })
    })

    autocompleteRef.current = autocompleteInstance
    isInitializedRef.current = true

    return () => {
      if (autocompleteInstance) {
        google.maps.event.clearInstanceListeners(autocompleteInstance)
      }
      isInitializedRef.current = false
    }
  }, [isGoogleReady, loadError, onChange, onLocationSelect])

  // Synchroniser l'état local avec la prop value quand elle change depuis l'extérieur
  useEffect(() => {
    if (value !== inputValue && document.activeElement !== inputRef.current) {
      setInputValue(value)
    }
  }, [value])

  const handleClear = () => {
    setInputValue('')
    onChange('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mettre à jour la valeur quand l'utilisateur tape
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
  }

  if (isMissingGoogleKey) {
    return (
      <div className={`location-autocomplete ${className}`}>
        <div className="location-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="location-input"
          placeholder="Clé Google Maps manquante — saisissez l'adresse"
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          autoComplete="off"
          formNoValidate
        />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={`location-autocomplete ${className}`}>
        <div className="location-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="location-input"
          placeholder="Google Maps indisponible — saisissez l'adresse"
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          autoComplete="off"
          formNoValidate
        />
        </div>
      </div>
    )
  }

  if (!isGoogleReady) {
    return (
      <div className={`location-autocomplete ${className}`}>
        <div className="location-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="location-input"
          placeholder="Chargement de Google Maps..."
          value={inputValue}
          onChange={handleInputChange}
          disabled={true}
          autoComplete="off"
          formNoValidate
        />
          <Loader size={18} className="location-input-loader" />
        </div>
      </div>
    )
  }

  return (
    <div className={`location-autocomplete ${className}`}>
      <div className="location-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="location-input"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          autoComplete="off"
          formNoValidate
        />
        {inputValue && (
          <button
            type="button"
            className="location-input-clear"
            onClick={handleClear}
            aria-label="Effacer"
          >
            <X size={16} />
          </button>
        )}
        {(!inputValue || inputValue.length === 0) && (
          <Search size={18} className="location-input-icon" />
        )}
      </div>
    </div>
  )
}
