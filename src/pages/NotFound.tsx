import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Search } from 'lucide-react'
import { PageMeta } from '../components/PageMeta'
import './NotFound.css'

export default function NotFound() {
  const { t } = useTranslation(['common'])

  return (
    <>
      <PageMeta title={t('common:meta.notFound.title')} description={t('common:meta.notFound.description')} />
      <div className="not-found-page" role="main">
      <div className="not-found-content">
        <span className="not-found-code" aria-hidden="true">404</span>
        <h1 className="not-found-title">{t('common:notFound.title')}</h1>
        <p className="not-found-message">{t('common:notFound.message')}</p>
        <nav className="not-found-actions" aria-label={t('common:notFound.navLabel')}>
          <Link to="/home" className="not-found-link not-found-link--primary">
            <Home size={20} aria-hidden="true" />
            {t('common:notFound.goHome')}
          </Link>
          <Link to="/search" className="not-found-link not-found-link--secondary">
            <Search size={20} aria-hidden="true" />
            {t('common:notFound.goSearch')}
          </Link>
        </nav>
      </div>
    </div>
    </>
  )
}
