import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader, X } from 'lucide-react'
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
}

// Cache simple pour éviter les requêtes répétées
const locationCache = new Map<string, { data: LocationSuggestion[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const LocationAutocomplete = ({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Rechercher un lieu...',
  className = '',
  disabled = false
}: LocationAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Recherche avec debounce réduit pour plus de réactivité
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!value.trim() || value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      setIsLoading(false)
      return
    }

    timeoutRef.current = setTimeout(() => {
      searchLocations(value)
    }, 200) // Réduit de 300ms à 200ms

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value])

  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 2) {
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `limit=5&` +
        `addressdetails=1&` +
        `countrycodes=fr&` + // Limiter à la France (optionnel, retirez si vous voulez international)
        `accept-language=fr`,
        {
          headers: {
            'User-Agent': 'Ollync App' // Requis par Nominatim
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche')
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
      console.error('Error searching locations:', error)
      setSuggestions([])
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
          className="location-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          disabled={disabled}
        />
        {isLoading && (
          <Loader size={18} className="location-input-loader" />
        )}
        {value && !isLoading && (
          <button
            type="button"
            className="location-input-clear"
            onClick={handleClear}
            aria-label="Effacer"
          >
            <X size={16} />
          </button>
        )}
        {!isLoading && (!value || value.length === 0) && (
          <MapPin size={20} className="location-input-icon" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
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

