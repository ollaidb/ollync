declare global {
  interface Window {
    __ollyncGoogleMapsLibraries?: ('places' | 'drawing' | 'geometry' | 'visualization')[]
  }
}

export const GOOGLE_MAPS_SCRIPT_ID = 'ollync-google-maps-script'

const fallbackLibraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places']

export const GOOGLE_MAPS_LIBRARIES =
  typeof window !== 'undefined'
    ? (window.__ollyncGoogleMapsLibraries ||= fallbackLibraries)
    : fallbackLibraries
