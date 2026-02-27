import { useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { useBackHandler } from '../hooks/useBackHandler'
import './SwipeBack.css'

const EDGE_WIDTH_PX = 24
const SWIPE_THRESHOLD_PX = 50

/**
 * Returns true if the current path is a "secondary" page where swipe-back should work
 * (conversation, profile sub-page, post/annonce).
 */
function isSecondaryPage(pathname: string): boolean {
  if (pathname.startsWith('/messages/') && pathname !== '/messages') {
    return true
  }
  if (pathname.startsWith('/profile/') && pathname !== '/profile') {
    return true
  }
  if (pathname.startsWith('/post/')) {
    return true
  }
  return false
}

/**
 * Mobile-only: enables iOS-style edge swipe-from-left to go back
 * on conversation, profile sub-pages, and post (annonce) pages.
 */
export default function SwipeBack() {
  const location = useLocation()
  const isMobile = useIsMobile()
  const handleBack = useBackHandler()
  const touchRef = useRef<{ startX: number; startY: number } | null>(null)

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || !isSecondaryPage(location.pathname)) return
      const touch = e.touches[0]
      if (touch.clientX <= EDGE_WIDTH_PX) {
        touchRef.current = { startX: touch.clientX, startY: touch.clientY }
      }
    },
    [isMobile, location.pathname]
  )

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchRef.current.startX
    const deltaY = touch.clientY - touchRef.current.startY
    // If user swiped left (back) or scrolled vertically a lot, cancel the gesture
    if (deltaX < -20 || Math.abs(deltaY) > 80) {
      touchRef.current = null
    }
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchRef.current) return
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchRef.current.startX
      touchRef.current = null
      if (deltaX >= SWIPE_THRESHOLD_PX) {
        handleBack()
      }
    },
    [handleBack]
  )

  if (!isMobile || !isSecondaryPage(location.pathname)) {
    return null
  }

  return (
    <div
      className="swipe-back-edge"
      role="presentation"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touchRef.current = null
      }}
      aria-hidden
    />
  )
}
