import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, Home } from 'lucide-react'
import i18n from 'i18next'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  retryKey: number
}

/**
 * Boutons utilisant window.location pour garantir que les actions fonctionnent
 * même en cas d'erreur de chargement de module ou de contexte React dégradé.
 */
// eslint-disable-next-line react-refresh/only-export-components -- local helper component
function ErrorBoundaryActions() {
  const handleRetry = () => {
    window.location.reload()
  }
  const handleGoHome = () => {
    window.location.replace('/home')
  }
  return (
    <nav
      className="error-boundary-actions"
      aria-label={i18n.t('common:errorBoundary.navLabel')}
    >
      <button
        type="button"
        className="error-boundary-btn error-boundary-btn--primary"
        onClick={handleRetry}
      >
        <RefreshCw size={20} aria-hidden="true" />
        {i18n.t('common:errorBoundary.retry')}
      </button>
      <button
        type="button"
        className="error-boundary-btn error-boundary-btn--secondary"
        onClick={handleGoHome}
      >
        <Home size={20} aria-hidden="true" />
        {i18n.t('common:errorBoundary.goHome')}
      </button>
    </nav>
  )
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, retryKey: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-page" role="alert">
          <div className="error-boundary-content">
            <span className="error-boundary-icon" aria-hidden="true">
              <RefreshCw size={48} strokeWidth={1.5} />
            </span>
            <h1 className="error-boundary-title">
              {i18n.t('common:errorBoundary.title')}
            </h1>
            <p className="error-boundary-message">
              {i18n.t('common:errorBoundary.message')}
            </p>
            <ErrorBoundaryActions />
          </div>
        </div>
      )
    }

    return (
      <div key={this.state.retryKey} style={{ display: 'contents' }}>
        {this.props.children}
      </div>
    )
  }
}
