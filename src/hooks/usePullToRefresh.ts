/**
 * Hook pour détecter le pull-to-refresh sur un conteneur scrollable.
 * Fonctionne uniquement sur mobile/touch.
 */
import { useCallback, useRef, useState } from 'react'

const PULL_THRESHOLD = 70
const RESISTANCE = 0.5
const MAX_PULL = 120

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  enabled?: boolean
}

export function usePullToRefresh({ onRefresh, enabled = true }: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const scrollTopRef = useRef(0)
  const pullDistanceRef = useRef(0)

  pullDistanceRef.current = pullDistance

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || refreshing) return
    touchStartY.current = e.touches[0].clientY
    const target = e.currentTarget as HTMLElement
    scrollTopRef.current = target.scrollTop
  }, [enabled, refreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || refreshing) return
    const target = e.currentTarget as HTMLElement
    scrollTopRef.current = target.scrollTop
    if (target.scrollTop > 0) return

    const currentY = e.touches[0].clientY
    const deltaY = currentY - touchStartY.current

    if (deltaY > 0) {
      const resistance = Math.min(deltaY * RESISTANCE, MAX_PULL)
      setPullDistance(resistance)
    }
  }, [enabled, refreshing])

  const handleTouchEnd = useCallback(async () => {
    const distance = pullDistanceRef.current
    setPullDistance(0)

    if (!enabled || refreshing) return

    if (distance >= PULL_THRESHOLD) {
      setRefreshing(true)
      setPullDistance(0)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    } else {
      setPullDistance(0)
    }
  }, [enabled, refreshing, onRefresh])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled || refreshing) return
    touchStartY.current = e.clientY
    const target = e.currentTarget as HTMLElement
    scrollTopRef.current = target.scrollTop
  }, [enabled, refreshing])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!enabled || refreshing) return
    const target = e.currentTarget as HTMLElement
    scrollTopRef.current = target.scrollTop
    if (target.scrollTop > 0) return

    const deltaY = e.clientY - touchStartY.current

    if (deltaY > 0) {
      const resistance = Math.min(deltaY * RESISTANCE, MAX_PULL)
      setPullDistance(resistance)
    }
  }, [enabled, refreshing])

  const handleMouseUp = useCallback(async () => {
    const distance = pullDistanceRef.current
    setPullDistance(0)

    if (!enabled || refreshing) return

    if (distance >= PULL_THRESHOLD) {
      setRefreshing(true)
      setPullDistance(0)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    } else {
      setPullDistance(0)
    }
  }, [enabled, refreshing, onRefresh])

  return {
    pullDistance,
    refreshing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
    },
  }
}
