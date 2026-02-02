import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import './HeaderMinimal.css'

interface HeaderMinimalProps {
  showSearch?: boolean
  showNotifications?: boolean
}

const HeaderMinimal = ({ showSearch = false, showNotifications = true }: HeaderMinimalProps) => {
  const navigate = useNavigate()
  const { t } = useTranslation(['search', 'common'])
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="header-minimal">
      <div className="header-minimal-content">
        {showSearch && (
          <form onSubmit={handleSearch} className="header-minimal-search">
            <Search size={20} />
            <input
              type="text"
              placeholder={t('search:inputPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        )}
        {showNotifications && (
          <button
            className="header-minimal-notification"
            onClick={() => navigate('/notifications')}
            aria-label={t('nav.notifications')}
          >
            <Bell size={24} />
            <span className="header-minimal-badge">17</span>
          </button>
        )}
      </div>
    </header>
  )
}

export default HeaderMinimal

