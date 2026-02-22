declare global {
  interface Window {
    __ollyncGoogleMapsPromise?: Promise<void>
  }
}

const GOOGLE_MAPS_SCRIPT_ID = 'ollync-google-maps-script'

export const isGoogleMapsReady = () =>
  typeof window !== 'undefined' && !!window.google?.maps && !!window.google?.maps?.places

export const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  if (!apiKey) {
    return Promise.reject(new Error('Clé Google Maps manquante'))
  }

  if (isGoogleMapsReady()) {
    return Promise.resolve()
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Google Maps indisponible côté serveur'))
  }

  if (window.__ollyncGoogleMapsPromise) {
    return window.__ollyncGoogleMapsPromise
  }

  window.__ollyncGoogleMapsPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Erreur chargement Google Maps')), { once: true })

      const waitForReady = () => {
        if (isGoogleMapsReady()) {
          resolve()
          return
        }
        setTimeout(waitForReady, 100)
      }
      waitForReady()
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_MAPS_SCRIPT_ID
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`

    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Erreur chargement Google Maps'))

    document.head.appendChild(script)
  }).catch((error) => {
    window.__ollyncGoogleMapsPromise = undefined
    throw error
  })

  return window.__ollyncGoogleMapsPromise
}

