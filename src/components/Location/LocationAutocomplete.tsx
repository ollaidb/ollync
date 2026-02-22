import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader, X, Check } from 'lucide-react'
import './LocationAutocomplete.css'

interface LocationSuggestion {
  display_name: string
  lat: string
  lon: string
  place_id: number
  address?: {
    city?: string
    town?: string
    village?: string
    country?: string
    postcode?: string
  }
}

interface LocationAutocompleteProps {
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
  onIconClick?: () => void
}

// Cache simple pour éviter les requêtes répétées
const locationCache = new Map<string, { data: LocationSuggestion[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
let nominatimUnavailableInBrowser = false
const ENABLE_BROWSER_NOMINATIM =
  String((import.meta as any).env?.VITE_ENABLE_NOMINATIM_BROWSER || '').toLowerCase() === 'true'

export const LocationAutocomplete = ({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Rechercher un lieu...',
  className = '',
  disabled = false,
  onIconClick
}: LocationAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [hasSelected, setHasSelected] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [userInitiated, setUserInitiated] = useState(false)
  const [autocompleteUnavailable, setAutocompleteUnavailable] = useState(
    nominatimUnavailableInBrowser || !ENABLE_BROWSER_NOMINATIM
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Recherche avec debounce réduit pour plus de réactivité
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!value.trim() || value.length < 2 || !isFocused || !userInitiated || autocompleteUnavailable) {
      setSuggestions([])
      setShowSuggestions(false)
      setIsLoading(false)
      if (value.trim().length === 0) {
        setHasSelected(false)
      }
      return
    }

    // Si l'utilisateur efface et retape, réinitialiser hasSelected
    setHasSelected(false)

    timeoutRef.current = setTimeout(() => {
      searchLocations(value)
    }, 200) // Réduit de 300ms à 200ms

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, isFocused, userInitiated, autocompleteUnavailable])

  useEffect(() => {
    if (value.trim().length > 0 && !isFocused && !userInitiated) {
      setHasSelected(true)
      setShowSuggestions(false)
    }
  }, [value, isFocused, userInitiated])

  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 2 || autocompleteUnavailable) {
      setSuggestions([])
      return
    }

    const normalizedQuery = query.trim().toLowerCase()
    
    // Vérifier le cache
    const cached = locationCache.get(normalizedQuery)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setSuggestions(cached.data)
      setShowSuggestions(true)
      setSelectedIndex(-1)
      return
    }

    setIsLoading(true)
    try {
      // Utilisation de l'API Nominatim d'OpenStreetMap (gratuite)
      // Recherche mondiale activée - pas de restriction géographique
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `limit=5&` +
        `addressdetails=1&` +
        `accept-language=fr`
      )

      if (!response.ok) {
        throw new Error(`Erreur lors de la recherche (${response.status})`)
      }

      const data: LocationSuggestion[] = await response.json()
      
      // Mettre en cache
      locationCache.set(normalizedQuery, {
        data,
        timestamp: Date.now()
      })
      
      setSuggestions(data)
      setShowSuggestions(true)
      setSelectedIndex(-1)
      
      // Faire défiler pour rendre les suggestions visibles
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }, 100)
    } catch (error) {
      // Nominatim bloque souvent les appels navigateur (CORS/403).
      // On désactive l'autocomplete pour cette session et on garde la saisie manuelle.
      nominatimUnavailableInBrowser = true
      setAutocompleteUnavailable(true)
      setSuggestions([])
      setShowSuggestions(false)
      console.warn('Autocomplete lieu indisponible (CORS/Nominatim). Saisie manuelle conservée.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (suggestion: LocationSuggestion) => {
    const address = suggestion.display_name
    const lat = parseFloat(suggestion.lat)
    const lng = parseFloat(suggestion.lon)
    const city = suggestion.address?.city || 
                 suggestion.address?.town || 
                 suggestion.address?.village || 
                 ''

    onChange(address)
    onLocationSelect({
      address,
      lat,
      lng,
      city
    })
    setShowSuggestions(false)
    setSuggestions([])
    setHasSelected(true)
    setUserInitiated(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  const handleClear = () => {
    onChange('')
    setSuggestions([])
    setShowSuggestions(false)
    setHasSelected(false)
    setUserInitiated(false)
    inputRef.current?.focus()
  }

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`location-autocomplete ${className}`}>
      <div className="location-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className={`location-input ${hasSelected ? 'location-input-selected' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            setUserInitiated(true)
            onChange(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true)
            if (suggestions.length > 0 && !hasSelected && userInitiated) {
              setShowSuggestions(true)
            }
          }}
          onBlur={() => {
            setIsFocused(false)
            setShowSuggestions(false)
          }}
          disabled={disabled}
        />
        {isLoading && (
          <Loader size={18} className="location-input-loader" />
        )}
        {hasSelected && !isLoading && (
          <Check size={20} className="location-input-check" style={{ color: '#10b981' }} />
        )}
        {value && !isLoading && !hasSelected && (
          <button
            type="button"
            className="location-input-clear"
            onClick={handleClear}
            aria-label="Effacer"
          >
            <X size={16} />
          </button>
        )}
        {!isLoading && !hasSelected && (!value || value.length === 0) && (
          onIconClick ? (
            <button
              type="button"
              className="location-input-icon-btn"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onIconClick()
              }}
              aria-label="Ouvrir les filtres de lieu"
            >
              <MapPin size={20} className="location-input-icon" />
            </button>
          ) : (
            <MapPin size={20} className="location-input-icon" />
          )
        )}
      </div>

      {autocompleteUnavailable && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: '#6b7280'
          }}
        >
          Recherche automatique indisponible. Saisissez le lieu manuellement.
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && !hasSelected && (
        <div ref={suggestionsRef} className="location-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              className={`location-suggestion-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <MapPin size={16} className="location-suggestion-icon" />
              <div className="location-suggestion-content">
                <div className="location-suggestion-name">
                  {suggestion.display_name.split(',')[0]}
                </div>
                <div className="location-suggestion-details">
                  {suggestion.display_name.split(',').slice(1).join(',').trim()}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
