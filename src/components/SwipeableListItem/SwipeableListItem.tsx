import { useRef, useState, useCallback, type ReactNode } from 'react'
import './SwipeableListItem.css'

export interface SwipeAction {
  id: string
  label: string
  icon: ReactNode
  onClick: () => void
  destructive?: boolean
}

interface SwipeableListItemProps {
  children: ReactNode
  actions: SwipeAction[]
  onItemClick?: () => void
  /** Désactive le swipe (ex: desktop). Par défaut activé sur touch. */
  enabled?: boolean
  className?: string
}

const ACTION_WIDTH = 72
const SNAP_DURATION = 200

export function SwipeableListItem({
  children,
  actions,
  onItemClick,
  enabled = true,
  className = ''
}: SwipeableListItemProps) {
  const [offset, setOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const startXRef = useRef(0)
  const startOffsetRef = useRef(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const maxOffset = actions.length * ACTION_WIDTH

  const applyOffset = useCallback((value: number) => {
    const clamped = Math.max(-maxOffset, Math.min(0, value))
    setOffset(clamped)
  }, [maxOffset])

  const snap = useCallback(() => {
    if (maxOffset === 0) return
    setIsAnimating(true)
    const current = offset
    const openThreshold = -maxOffset / 2
    const target = current < openThreshold ? -maxOffset : 0
    setOffset(target)
    window.setTimeout(() => setIsAnimating(false), SNAP_DURATION)
  }, [maxOffset, offset])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || actions.length === 0) return
      startXRef.current = e.touches[0].clientX
      startOffsetRef.current = offset
    },
    [enabled, actions.length, offset]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || actions.length === 0) return
      const deltaX = e.touches[0].clientX - startXRef.current
      const next = startOffsetRef.current + deltaX
      applyOffset(next)
    },
    [enabled, actions.length, applyOffset]
  )

  const handleTouchEnd = useCallback(() => {
    if (!enabled || actions.length === 0) return
    snap()
  }, [enabled, actions.length, snap])

  const handleClick = useCallback(() => {
    if (offset < -10) {
      snap()
      return
    }
    onItemClick?.()
  }, [offset, snap, onItemClick])

  const handleActionClick = useCallback(
    (action: SwipeAction) => (e: React.MouseEvent) => {
      e.stopPropagation()
      setOffset(0)
      action.onClick()
    },
    []
  )

  if (!enabled || actions.length === 0) {
    return (
      <div className={`swipeable-list-item ${className}`.trim()} onClick={onItemClick}>
        {children}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`swipeable-list-item ${className}`.trim()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <div
        className="swipeable-list-item__content"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isAnimating ? `transform ${SNAP_DURATION}ms ease-out` : 'none'
        }}
      >
        {children}
      </div>
      <div
        className="swipeable-list-item__actions"
        style={{ width: maxOffset }}
        aria-hidden
      >
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={`swipeable-list-item__action ${action.destructive ? 'destructive' : ''}`}
            onClick={handleActionClick(action)}
          >
            <span className="swipeable-list-item__action-icon">{action.icon}</span>
            <span className="swipeable-list-item__action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
