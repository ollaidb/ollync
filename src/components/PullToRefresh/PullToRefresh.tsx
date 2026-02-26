/**
 * Pull-to-refresh : affiche un spinner en haut lors du tirage.
 * S’adapte aux couleurs de l’app, petit et moderne.
 */
import { usePullToRefresh } from '../../hooks/usePullToRefresh'
import { PullToRefreshSpinner } from './PullToRefreshSpinner'
import './PullToRefresh.css'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void> | void
  className?: string
  enabled?: boolean
}

export function PullToRefresh({ children, onRefresh, className = '', enabled = true }: PullToRefreshProps) {
  const { pullDistance, refreshing, handlers } = usePullToRefresh({ onRefresh, enabled })

  const showIndicator = pullDistance > 0 || refreshing

  return (
    <div className="pull-to-refresh">
      <div
        className="pull-to-refresh__indicator"
        data-visible={showIndicator}
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        <PullToRefreshSpinner />
      </div>
      <div
        className={`pull-to-refresh__scroll ${className}`.trim()}
        style={{ transform: showIndicator ? `translateY(${Math.min(pullDistance, 56)}px)` : undefined }}
        {...handlers}
      >
        {children}
      </div>
    </div>
  )
}
