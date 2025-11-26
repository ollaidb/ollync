import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search as SearchIcon, User } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import HeaderMinimal from '../components/HeaderMinimal'
import Footer from '../components/Footer'
import './Search.css'

interface Profile {
  id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  bio?: string | null
}

const Search = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(query)
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSearchQuery(query)
    if (query) {
      searchUsers(query)
    }
  }, [query])

  const searchUsers = async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(20)

    if (error) {
      console.error('Error searching users:', error)
      setResults([])
    } else {
      setResults(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="app">
      <HeaderMinimal showSearch={true} />
      <main className="main-content without-header">
        <div className="search-page">
          <div className="search-header">
            <h1>Recherche</h1>
            <p>Recherchez des utilisateurs par nom ou username</p>
          </div>

          {loading ? (
            <div className="loading-container">
              <p>Recherche en cours...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="search-results">
              {results.map((profile) => (
                <Link
                  key={profile.id}
                  to={`/profile/${profile.id}`}
                  className="profile-card"
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name || ''} />
                  ) : (
                    <div className="avatar-placeholder">
                      <User size={24} />
                    </div>
                  )}
                  <div className="profile-info">
                    <div className="profile-name">
                      {profile.full_name || profile.username || 'Utilisateur'}
                    </div>
                    {profile.username && (
                      <div className="profile-username">@{profile.username}</div>
                    )}
                    {profile.bio && (
                      <div className="profile-bio">{profile.bio}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="empty-state">
              <p>Aucun résultat trouvé</p>
            </div>
          ) : (
            <div className="empty-state">
              <SearchIcon size={48} />
              <p>Commencez à rechercher un utilisateur</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Search

