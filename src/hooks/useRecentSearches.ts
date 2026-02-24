import { useState, useCallback } from 'react'

const STORAGE_KEY = 'ollync_recent_searches'
const MAX_ITEMS = 10

export interface RecentSearchItem {
  id: string
  searchQuery?: string
  categorySlug?: string
  categoryName?: string
  subcategorySlug?: string
  subcategoryName?: string
  locationLabels?: string[]
  timestamp: number
}

function loadFromStorage(): RecentSearchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentSearchItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(items: RecentSearchItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

/** Génère un libellé affichable pour une recherche récente */
export function getRecentSearchDisplayLabel(item: RecentSearchItem): string {
  const parts: string[] = []
  if (item.searchQuery && item.searchQuery.trim()) {
    parts.push(item.searchQuery.trim())
  }
  if (item.categoryName) {
    if (item.subcategoryName) {
      parts.push(`${item.categoryName} › ${item.subcategoryName}`)
    } else {
      parts.push(item.categoryName)
    }
  }
  if (item.locationLabels && item.locationLabels.length > 0) {
    parts.push(item.locationLabels.join(', '))
  }
  return parts.join(' · ') || 'Recherche'
}

/** Compare deux recherches pour déduplication */
function isSameSearch(a: RecentSearchItem, b: RecentSearchItem): boolean {
  const qA = (a.searchQuery || '').trim().toLowerCase()
  const qB = (b.searchQuery || '').trim().toLowerCase()
  if (qA !== qB) return false
  if ((a.categorySlug || '') !== (b.categorySlug || '')) return false
  if ((a.subcategorySlug || '') !== (b.subcategorySlug || '')) return false
  const locA = (a.locationLabels || []).join(',').toLowerCase()
  const locB = (b.locationLabels || []).join(',').toLowerCase()
  return locA === locB
}

export function useRecentSearches() {
  const [items, setItems] = useState<RecentSearchItem[]>(loadFromStorage)

  const addRecentSearch = useCallback(
    (item: Omit<RecentSearchItem, 'id' | 'timestamp'>) => {
      const full: RecentSearchItem = {
        ...item,
        id: crypto.randomUUID?.() ?? `rs-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now()
      }

      setItems((prev) => {
        const filtered = prev.filter((p) => !isSameSearch(p, full))
        const next = [full, ...filtered].slice(0, MAX_ITEMS)
        saveToStorage(next)
        return next
      })
    },
    []
  )

  const removeRecentSearch = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id)
      saveToStorage(next)
      return next
    })
  }, [])

  /** Supprime plusieurs recherches récentes en une fois (ex. tous les mots de la même racine) */
  const removeRecentSearchesByIds = useCallback((ids: string[]) => {
    const set = new Set(ids)
    setItems((prev) => {
      const next = prev.filter((i) => !set.has(i.id))
      saveToStorage(next)
      return next
    })
  }, [])

  const clearRecentSearches = useCallback(() => {
    setItems([])
    saveToStorage([])
  }, [])

  return {
    recentSearches: items,
    addRecentSearch,
    removeRecentSearch,
    removeRecentSearchesByIds,
    clearRecentSearches
  }
}
