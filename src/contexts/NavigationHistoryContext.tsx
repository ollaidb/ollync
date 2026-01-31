import { createContext, useContext, useEffect, useRef, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface NavigationHistoryContextType {
  getPreviousPath: () => string
  markNavigatingBack: () => void
  resetHistory: () => void
  canGoBack: () => boolean
  history: string[]
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | undefined>(undefined)

export const NavigationHistoryProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const historyRef = useRef<string[]>([])
  const isNavigatingBackRef = useRef(false)
  const isInitializedRef = useRef(false)
  const previousLocationRef = useRef<string>('')
  const mainTabRoots = [
    '/home',
    '/favorites',
    '/likes',
    '/publish',
    '/publier-annonce',
    '/messages',
    '/profile',
    '/search'
  ]

  const isMainTabRoot = (pathname: string) => mainTabRoots.includes(pathname)

  useEffect(() => {
    const currentPath = location.pathname + location.search
    const currentPathname = location.pathname
    const previousPathname = previousLocationRef.current.split('?')[0]

    // Initialiser l'historique avec la page actuelle au premier chargement
    if (!isInitializedRef.current) {
      historyRef.current = [currentPath]
      previousLocationRef.current = currentPath
      isInitializedRef.current = true
      return
    }

    // Si on navigue en arrière, ne pas ajouter à l'historique
    if (isNavigatingBackRef.current) {
      isNavigatingBackRef.current = false
      previousLocationRef.current = currentPath
      return
    }

    // Ne pas ajouter si c'est la même page (même pathname et search)
    if (previousLocationRef.current === currentPath) {
      return
    }

    // Ne pas ajouter si c'est juste un changement de hash (anchor)
    if (currentPathname === previousPathname && currentPath !== previousLocationRef.current) {
      // C'est juste un changement de query params, on remplace la dernière entrée
      if (historyRef.current.length > 0) {
        historyRef.current[historyRef.current.length - 1] = currentPath
      }
      previousLocationRef.current = currentPath
      return
    }

    // Si on change d'onglet principal, ne pas empiler les onglets entre eux
    if (isMainTabRoot(currentPathname) && isMainTabRoot(previousPathname) && currentPathname !== previousPathname) {
      historyRef.current = [currentPath]
      previousLocationRef.current = currentPath
      return
    }

    // Ajouter la nouvelle page à l'historique seulement si c'est une vraie navigation
    historyRef.current.push(currentPath)
    previousLocationRef.current = currentPath

    // Limiter la taille de l'historique (garder les 100 dernières pages)
    if (historyRef.current.length > 100) {
      historyRef.current = historyRef.current.slice(-100)
    }
  }, [location])

  /**
   * Retourne le chemin précédent dans l'historique
   * Si aucun historique, retourne '/home'
   */
  const getPreviousPath = (): string => {
    if (historyRef.current.length <= 1) {
      return '/home'
    }

    // Retirer la page actuelle
    const previousHistory = historyRef.current.slice(0, -1)
    
    // Retourner la dernière page de l'historique (avant la page actuelle)
    const previousPath = previousHistory[previousHistory.length - 1] || '/home'
    
    // Ne pas retourner vers la même page
    const currentPath = location.pathname + location.search
    if (previousPath === currentPath && previousHistory.length > 1) {
      return previousHistory[previousHistory.length - 2] || '/home'
    }
    
    return previousPath
  }

  /**
   * Marque qu'on navigue en arrière pour éviter d'ajouter à l'historique
   */
  const markNavigatingBack = () => {
    isNavigatingBackRef.current = true
    
    // Retirer la page actuelle de l'historique
    if (historyRef.current.length > 0) {
      historyRef.current.pop()
    }
  }

  /**
   * Réinitialise l'historique (utile pour certaines pages comme la page d'accueil)
   */
  const resetHistory = () => {
    const currentPath = location.pathname + location.search
    historyRef.current = [currentPath]
    previousLocationRef.current = currentPath
  }

  /**
   * Vérifie si on peut retourner en arrière
   */
  const canGoBack = (): boolean => {
    return historyRef.current.length > 1
  }

  const value: NavigationHistoryContextType = {
    getPreviousPath,
    markNavigatingBack,
    resetHistory,
    canGoBack,
    history: historyRef.current
  }

  return (
    <NavigationHistoryContext.Provider value={value}>
      {children}
    </NavigationHistoryContext.Provider>
  )
}

export const useNavigationHistory = () => {
  const context = useContext(NavigationHistoryContext)
  if (context === undefined) {
    throw new Error('useNavigationHistory must be used within a NavigationHistoryProvider')
  }
  return context
}
