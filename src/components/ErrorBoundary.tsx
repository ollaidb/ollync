import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Home } from 'lucide-react'
import i18n from 'i18next'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null })
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
            <nav
              className="error-boundary-actions"
              aria-label={i18n.t('common:errorBoundary.navLabel')}
            >
              <button
                type="button"
                className="error-boundary-btn error-boundary-btn--primary"
                onClick={this.reset}
              >
                <RefreshCw size={20} aria-hidden="true" />
                {i18n.t('common:errorBoundary.retry')}
              </button>
              <Link
                to="/home"
                className="error-boundary-btn error-boundary-btn--secondary"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                <Home size={20} aria-hidden="true" />
                {i18n.t('common:errorBoundary.goHome')}
              </Link>
            </nav>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
