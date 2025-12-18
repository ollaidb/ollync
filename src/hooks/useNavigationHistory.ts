import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook pour gérer l'historique de navigation
 * Maintient une pile de navigation pour permettre un retour logique
 */
export const useNavigationHistory = () => {
  const location = useLocation()
  const historyRef = useRef<string[]>([])
  const isNavigatingBackRef = useRef(false)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    const currentPath = location.pathname + location.search

    // Initialiser l'historique avec la page actuelle au premier chargement
    if (!isInitializedRef.current) {
      historyRef.current = [currentPath]
      isInitializedRef.current = true
      return
    }

    // Si on navigue en arrière, ne pas ajouter à l'historique
    if (isNavigatingBackRef.current) {
      isNavigatingBackRef.current = false
      return
    }

    // Ne pas ajouter si c'est la même page
    if (historyRef.current[historyRef.current.length - 1] === currentPath) {
      return
    }

    // Ajouter la nouvelle page à l'historique
    historyRef.current.push(currentPath)

    // Limiter la taille de l'historique (garder les 50 dernières pages)
    if (historyRef.current.length > 50) {
      historyRef.current = historyRef.current.slice(-50)
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
    return previousHistory[previousHistory.length - 1] || '/home'
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
    historyRef.current = [location.pathname + location.search]
  }

  return {
    getPreviousPath,
    markNavigatingBack,
    resetHistory,
    history: historyRef.current
  }
}

