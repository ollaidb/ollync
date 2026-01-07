import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader, X } from 'lucide-react'
import { useLoadScript } from '@react-google-maps/api'
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

const libraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places']

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

  // Récupération de la clé API depuis les variables d'environnement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries
  })

  // Initialiser l'autocomplete quand Google Maps est chargé
  useEffect(() => {
    if (!isLoaded || !inputRef.current || loadError || isInitializedRef.current) return

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
  }, [isLoaded, loadError, onChange, onLocationSelect])

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

  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    return (
      <div className={`location-autocomplete ${className}`}>
        <div className="location-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="location-input"
          placeholder="⚠️ Clé API Google Maps non configurée"
          value={inputValue}
          onChange={handleInputChange}
          disabled={true}
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
          placeholder="Erreur lors du chargement de Google Maps"
          value={inputValue}
          onChange={handleInputChange}
          disabled={true}
          autoComplete="off"
          formNoValidate
        />
        </div>
      </div>
    )
  }

  if (!isLoaded) {
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
          <MapPin size={20} className="location-input-icon" />
        )}
      </div>
    </div>
  )
}

