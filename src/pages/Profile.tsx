import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { User, Settings as SettingsIcon, Shield, HelpCircle, FileText, LogOut, ChevronRight, LucideIcon, FileEdit } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import BackButton from '../components/BackButton'
import PublicProfile from './profile/PublicProfile'
import EditPublicProfile from './profile/EditPublicProfile'
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
import PhoneNumber from './profile/PhoneNumber'
import TwoFactorAuth from './profile/TwoFactorAuth'
import ConnectedDevices from './profile/ConnectedDevices'
import Annonces from './profile/Annonces'
import Mail from './profile/Mail'
import OnlineStatus from './profile/OnlineStatus'
import DataManagement from './profile/DataManagement'
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
  const [loading, setLoading] = useState(true)

  // Si un ID est fourni dans /profile/public/:id, c'est un profil public d'un autre utilisateur
  // Ou si un ID est fourni dans /profile/:id et que ce n'est pas l'utilisateur connecté
  const isPublicProfileRoute = location.pathname.startsWith('/profile/public/')
  const isPublicProfile = (isPublicProfileRoute && !!id) || (!!id && id !== user?.id)
  
  // Déterminer la section active basée sur l'URL
  const getCurrentSection = () => {
    if (location.pathname === '/profile') return 'menu'
    if (location.pathname === '/profile/public') return 'public'
    if (location.pathname.startsWith('/profile/settings')) return 'settings'
    if (location.pathname.startsWith('/profile/security')) return 'security'
    if (location.pathname === '/profile/help') return 'help'
    if (location.pathname === '/profile/legal') return 'legal'
    if (location.pathname === '/profile/annonces') return 'annonces'
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
        // Si le profil n'existe pas (code PGRST116), créer le profil depuis auth.users
        if (error.code === 'PGRST116') {
          console.log('Profil non trouvé, création depuis auth.users...')
          
          // Créer le profil avec les données de auth.users
          const profileInsert = {
            id: user.id,
            email: user.email || null,
            full_name: user.user_metadata?.full_name || null,
            username: user.user_metadata?.username || null
          }
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(profileInsert as never)
            .select('id, username, full_name, avatar_url')
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            // Même en cas d'erreur, on crée un profil minimal pour l'affichage
            setProfile({
              id: user.id,
              username: user.user_metadata?.username || null,
              full_name: user.user_metadata?.full_name || null,
              avatar_url: null
            })
          } else if (newProfile) {
            setProfile(newProfile)
          }
        } else {
          console.error('Error fetching profile:', error)
          // En cas d'erreur, on crée un profil minimal
          setProfile({
            id: user.id,
            username: user.user_metadata?.username || null,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: null
          })
        }
      } else if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      // En cas d'erreur, on crée un profil minimal
      setProfile({
        id: user.id,
        username: user.user_metadata?.username || null,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: null
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // Rediriger vers la page d'accueil après déconnexion réussie
      navigate('/home')
      // Recharger la page pour s'assurer que tous les états sont réinitialisés
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } catch (error) {
      console.error('Error during sign out:', error)
      // Même en cas d'erreur, rediriger et recharger
      navigate('/home')
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }

  const renderContent = () => {
    // Si c'est un profil public, afficher directement le profil public
    if (isPublicProfile) {
      return <PublicProfile userId={id} isOwnProfile={id === user?.id} />
    }

    // Gérer les sous-pages
    if (location.pathname === '/profile/edit') {
      return <EditPublicProfile />
    }

    if (location.pathname === '/profile/settings/personal-info') {
      return <PersonalInfo />
    }

    if (location.pathname === '/profile/settings/payment') {
      return <PaymentMethods />
    }

    if (location.pathname === '/profile/settings/appearance') {
      return <Appearance />
    }

    if (location.pathname === '/profile/settings/mail') {
      return <Mail />
    }

    if (location.pathname === '/profile/settings/online-status') {
      return <OnlineStatus />
    }

    if (location.pathname === '/profile/settings/notifications') {
      return <Notifications />
    }

    if (location.pathname === '/profile/settings/data-management') {
      return <DataManagement />
    }

    if (location.pathname === '/profile/security/account-security') {
      return <AccountSecurity />
    }

    if (location.pathname === '/profile/security/password') {
      return <Password />
    }

    if (location.pathname === '/profile/security/phone') {
      return <PhoneNumber />
    }

    if (location.pathname === '/profile/security/two-factor') {
      return <TwoFactorAuth />
    }

    if (location.pathname === '/profile/security/devices') {
      return <ConnectedDevices />
    }

    if (location.pathname === '/profile/annonces') {
      return <Annonces />
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
        return <PublicProfile userId={user.id} isOwnProfile />
      case 'settings':
        return <Settings />
      case 'security':
        return <Security />
      case 'help':
        return <Help />
      case 'legal':
        return <Legal />
      case 'annonces':
        return <Annonces />
      default:
        return renderMenu()
    }
  }

  const renderMenu = () => {
    // Utiliser uniquement les données de profiles (synchronisées depuis auth.users)
    // Ne pas utiliser de fallback avec l'email pour éviter les noms automatiques
    const displayName = user 
      ? (profile?.full_name || profile?.username || 'Utilisateur')
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
        id: 'annonces', 
        icon: FileEdit, 
        label: 'Annonces', 
        path: '/profile/annonces',
        onClick: () => navigate('/profile/annonces'),
        requiresAuth: true
      },
      { 
        id: 'settings', 
        icon: SettingsIcon, 
        label: 'Paramètres', 
        path: '/profile/settings',
        onClick: () => navigate('/profile/settings'),
        requiresAuth: true
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
    <div className="app">
      <div className="profile-page">
        {/* Header fixe - Ne pas afficher pour les profils publics (ils ont leur propre header) */}
        {!isPublicProfile && (
          <div className="profile-header-fixed">
            <div className="profile-header-content">
              <BackButton />
              <h1 className="profile-title">
                {location.pathname === '/profile/annonces' ? 'Mes annonces' : 'Mon compte'}
              </h1>
              <div className="profile-header-spacer"></div>
            </div>
          </div>
        )}

        {/* Zone scrollable */}
        <div className="profile-scrollable">
          {loading && currentSection === 'menu' ? (
            <div className="profile-loading">Chargement...</div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
