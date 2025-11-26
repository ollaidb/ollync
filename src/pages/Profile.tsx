import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { User, Settings as SettingsIcon, Shield, HelpCircle, FileText, LogOut, ChevronRight, Package, LucideIcon } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import PageHeader from '../components/PageHeader'
import PublicProfile from './profile/PublicProfile'
import Settings from './profile/Settings'
import Security from './profile/Security'
import Help from './profile/Help'
import Legal from './profile/Legal'
import PersonalInfo from './profile/PersonalInfo'
import PaymentMethods from './profile/PaymentMethods'
import Appearance from './profile/Appearance'
import Notifications from './profile/Notifications'
import AccountSecurity from './profile/AccountSecurity'
import Password from './profile/Password'
import './Profile.css'

interface ProfileData {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

interface MenuItem {
  id: string
  icon: LucideIcon
  label: string
  path: string
  onClick: () => void
  requiresAuth: boolean
  subItems?: Array<{ label: string; path: string }>
}

const Profile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id?: string }>()
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [postsCount, setPostsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Si un ID est fourni, c'est un profil public d'un autre utilisateur
  const isPublicProfile = !!id && id !== user?.id
  
  // Déterminer la section active basée sur l'URL
  const getCurrentSection = () => {
    if (location.pathname === '/profile') return 'menu'
    if (location.pathname === '/profile/public') return 'public'
    if (location.pathname.startsWith('/profile/settings')) return 'settings'
    if (location.pathname.startsWith('/profile/security')) return 'security'
    if (location.pathname === '/profile/help') return 'help'
    if (location.pathname === '/profile/legal') return 'legal'
    return 'menu'
  }
  
  const currentSection = getCurrentSection()

  useEffect(() => {
    if (isPublicProfile) {
      setLoading(false)
      return
    }

    if (!user) {
      setLoading(false)
      return
    }

    fetchProfile()
    fetchPostsCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isPublicProfile])

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (error) {
        // Si le profil n'existe pas encore, ce n'est pas grave
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }
        // On crée un profil minimal avec les données de l'utilisateur
        setProfile({
          id: user.id,
          username: null,
          full_name: null,
          avatar_url: null
        })
      } else if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      // En cas d'erreur, on crée quand même un profil minimal
      setProfile({
        id: user.id,
        username: null,
        full_name: null,
        avatar_url: null
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPostsCount = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (!error && data !== null) {
      setPostsCount(data as unknown as number)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/home')
  }

  const renderContent = () => {
    // Si c'est un profil public, afficher directement le profil public
    if (isPublicProfile) {
      return <PublicProfile userId={id} />
    }

    // Gérer les sous-pages
    if (location.pathname === '/profile/settings/personal-info') {
      return <PersonalInfo />
    }

    if (location.pathname === '/profile/settings/payment') {
      return <PaymentMethods />
    }

    if (location.pathname === '/profile/settings/appearance') {
      return <Appearance />
    }

    if (location.pathname === '/profile/settings/notifications') {
      return <Notifications />
    }

    if (location.pathname === '/profile/security/account-security') {
      return <AccountSecurity />
    }

    if (location.pathname === '/profile/security/password') {
      return <Password />
    }

    switch (currentSection) {
      case 'menu':
        return renderMenu()
      case 'public':
        if (!user) {
          return (
            <div className="profile-empty-state">
              <User size={64} />
              <h2>Connexion requise</h2>
              <p>Connectez-vous pour accéder à votre profil</p>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/auth/login')}
              >
                Se connecter
              </button>
            </div>
          )
        }
        return <PublicProfile userId={user.id} isOwnProfile={true} />
      case 'settings':
        return <Settings />
      case 'security':
        return <Security />
      case 'help':
        return <Help />
      case 'legal':
        return <Legal />
      default:
        return renderMenu()
    }
  }

  const renderMenu = () => {
    const displayName = user 
      ? (profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'Utilisateur')
      : 'Se connecter'

    // Menu items de base (toujours disponibles)
    const baseMenuItems: MenuItem[] = [
      { 
        id: 'help', 
        icon: HelpCircle, 
        label: 'Aide', 
        path: '/profile/help',
        onClick: () => navigate('/profile/help'),
        requiresAuth: false
      },
      { 
        id: 'legal', 
        icon: FileText, 
        label: 'Pages légales', 
        path: '/profile/legal',
        onClick: () => navigate('/profile/legal'),
        requiresAuth: false
      }
    ]

    // Menu items nécessitant une connexion
    const authMenuItems: MenuItem[] = user ? [
      { 
        id: 'public', 
        icon: User, 
        label: 'Mon Profil', 
        path: '/profile/public',
        onClick: () => navigate('/profile/public'),
        requiresAuth: true
      },
      { 
        id: 'posts', 
        icon: Package, 
        label: `Annonces (${postsCount})`, 
        path: '/profile/public',
        onClick: () => navigate('/profile/public'),
        requiresAuth: true
      },
      { 
        id: 'settings', 
        icon: SettingsIcon, 
        label: 'Paramètres', 
        path: '/profile/settings',
        onClick: () => navigate('/profile/settings'),
        requiresAuth: true,
        subItems: [
          { label: 'Informations personnelles', path: '/profile/settings' },
          { label: 'E-mail', path: '/profile/settings' }
        ]
      },
      { 
        id: 'security', 
        icon: Shield, 
        label: 'Connexion et sécurité', 
        path: '/profile/security',
        onClick: () => navigate('/profile/security'),
        requiresAuth: true
      }
    ] : []

    const menuItems = [...authMenuItems, ...baseMenuItems]

    return (
      <div className="profile-menu-page">
        {/* Carte de profil */}
        <div 
          className="profile-card" 
          onClick={() => {
            if (user) {
              navigate('/profile/public')
            } else {
              navigate('/auth/login')
            }
          }}
        >
          <div className="profile-card-avatar">
            {user ? (
              profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={displayName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName)
                  }}
                />
              ) : (
                <div className="profile-card-avatar-placeholder">
                  {(displayName[0] || 'U').toUpperCase()}
                </div>
              )
            ) : (
              <div className="profile-card-avatar-placeholder">
                <User size={24} />
              </div>
            )}
          </div>
          <div className="profile-card-name">{displayName}</div>
          <ChevronRight size={20} className="profile-card-chevron" />
        </div>

        {/* Liste des options */}
        <div className="profile-menu-list">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <div key={item.id}>
                <button
                  className={`profile-menu-item ${isActive ? 'active' : ''}`}
                  onClick={item.onClick}
                >
                  <div className="profile-menu-item-icon">
                    <Icon size={20} />
                  </div>
                  <span className="profile-menu-item-label">{item.label}</span>
                  <ChevronRight size={18} className="profile-menu-item-chevron" />
                </button>
                {item.subItems && user && (
                  <div className="profile-menu-subitems">
                    {item.subItems.map((subItem, index) => (
                      <button
                        key={index}
                        className="profile-menu-subitem"
                        onClick={() => navigate(subItem.path)}
                      >
                        <span>{subItem.label}</span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bouton de déconnexion ou connexion */}
        {user ? (
          <button
            className="profile-menu-item profile-menu-item-logout"
            onClick={handleSignOut}
          >
            <div className="profile-menu-item-icon">
              <LogOut size={20} />
            </div>
            <span className="profile-menu-item-label">Déconnexion</span>
          </button>
        ) : (
          <button
            className="profile-menu-item profile-menu-item-login"
            onClick={() => navigate('/auth/login')}
          >
            <div className="profile-menu-item-icon">
              <User size={20} />
            </div>
            <span className="profile-menu-item-label">Se connecter</span>
            <ChevronRight size={18} className="profile-menu-item-chevron" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Mon compte" />
      <div className="page-content profile-page">
        {loading && currentSection === 'menu' ? (
          <div className="profile-loading">Chargement...</div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  )
}

export default Profile
