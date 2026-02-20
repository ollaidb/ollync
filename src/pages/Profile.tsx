import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  User,
  Settings as SettingsIcon,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  LucideIcon,
  FileEdit,
  FileText,
  Wallet,
  Receipt,
  Ticket,
  Briefcase
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import BackButton from '../components/BackButton'
import PublicProfile from './profile/PublicProfile'
import EditPublicProfile from './profile/EditPublicProfile'
import Settings from './profile/Settings'
import Security from './profile/Security'
import Help from './profile/Help'
import Legal from './profile/Legal'
import Contact from './profile/Contact'
import Resources from './profile/Resources'
import ResourcesBusiness from './profile/ResourcesBusiness'
import ResourcesIncome from './profile/ResourcesIncome'
import MentionsLegales from './profile/MentionsLegales'
import PolitiqueConfidentialite from './profile/PolitiqueConfidentialite'
import CGU from './profile/CGU'
import CGV from './profile/CGV'
import PolitiqueCookies from './profile/PolitiqueCookies'
import PageSecurite from './profile/PageSecurite'
import PersonalInfo from './profile/PersonalInfo'
import PaymentMethods from './profile/PaymentMethods'
import Appearance from './profile/Appearance'
import Notifications from './profile/Notifications'
import Language from './profile/Language'
import AccountSecurity from './profile/AccountSecurity'
import Password from './profile/Password'
import PhoneNumber from './profile/PhoneNumber'
import TwoFactorAuth from './profile/TwoFactorAuth'
import ConnectedDevices from './profile/ConnectedDevices'
import BlockedProfiles from './profile/BlockedProfiles'
import Annonces from './profile/Annonces'
import Mail from './profile/Mail'
import OnlineStatus from './profile/OnlineStatus'
import DataManagement from './profile/DataManagement'
import DeleteAccount from './profile/DeleteAccount'
import Contracts from './profile/Contracts'
import Moderation from './Moderation'
import WalletPage from './profile/Wallet.tsx'
import Transactions from './profile/Transactions.tsx'
import Tickets from './profile/Tickets.tsx'
import Candidature from './profile/Candidature.tsx'
import ConfirmationModal from '../components/ConfirmationModal'
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
  const appVersion = (import.meta.env.VITE_APP_VERSION as string | undefined) || '1.0.0'
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id?: string }>()
  const { user, signOut, loading: authLoading } = useAuth()
  const { t } = useTranslation(['profile', 'settings'])
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSignOutModal, setShowSignOutModal] = useState(false)

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
    if (location.pathname === '/profile/contact') return 'contact'
    if (location.pathname === '/profile/resources') return 'resources'
    if (location.pathname === '/profile/resources/creation-entreprise') return 'resources-page'
    if (location.pathname === '/profile/resources/declaration-revenus') return 'resources-page'
    if (location.pathname === '/profile/legal') return 'legal'
    if (location.pathname.startsWith('/profile/legal/')) return 'legal-page'
    if (location.pathname === '/profile/wallet') return 'wallet'
    if (location.pathname === '/profile/annonces') return 'annonces'
    if (location.pathname === '/profile/contracts') return 'contracts'
    if (location.pathname === '/profile/transactions') return 'transactions'
    if (location.pathname === '/profile/tickets') return 'tickets'
    if (location.pathname === '/profile/candidature' || location.pathname === '/profile/espace-candidat') return 'candidature'
    return 'menu'
  }
  
  const currentSection = getCurrentSection()

  useEffect(() => {
    if (isPublicProfile) {
      setLoading(false)
      return
    }

    // Attendre que useAuth ait fini de charger avant de récupérer le profil
    if (authLoading) {
      return
    }

    if (!user) {
      setLoading(false)
      return
    }

    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isPublicProfile, authLoading])

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      console.log('🔍 Récupération du profil pour l\'utilisateur:', user.id, user.email)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (error) {
        // Si le profil n'existe pas (useAuth devrait l'avoir créé, mais au cas où)
        // Utiliser user_metadata comme fallback
        console.warn('⚠️ Profil non trouvé, utilisation des métadonnées utilisateur:', error.code)
        setProfile({
          id: user.id,
          username: user.user_metadata?.username || null,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
        })
      } else if (data) {
        console.log('✅ Profil récupéré avec succès:', data)
        // Utiliser les données du profil avec fallback sur user_metadata si NULL
        const profileData = data as ProfileData
        setProfile({
          id: profileData.id,
          username: profileData.username || user.user_metadata?.username || null,
          full_name: profileData.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: profileData.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null
        })
      } else {
        // Aucune donnée retournée, utiliser user_metadata
        console.warn('⚠️ Aucune donnée retournée, utilisation des métadonnées utilisateur')
        setProfile({
          id: user.id,
          username: user.user_metadata?.username || null,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
        })
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du profil:', error)
      // En cas d'erreur, utiliser user_metadata comme fallback
      setProfile({
        id: user.id,
        username: user.user_metadata?.username || null,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOutClick = () => {
    setShowSignOutModal(true)
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
    // Si c'est un profil public d'un autre utilisateur, afficher le profil public
    if (isPublicProfile) {
      return <PublicProfile userId={id} isOwnProfile={false} />
    }
    
    // Si c'est /profile/public/:id et que c'est le propre profil de l'utilisateur
    if (location.pathname.startsWith('/profile/public/') && id && id === user?.id) {
      return <PublicProfile userId={id} isOwnProfile={true} />
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

    if (location.pathname === '/profile/settings/language') {
      return <Language />
    }

    if (location.pathname === '/profile/settings/data-management') {
      return <DataManagement />
    }

    if (location.pathname === '/profile/settings/delete-account') {
      return <DeleteAccount />
    }

    if (location.pathname === '/profile/security/moderation') {
      return <Moderation />
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

    if (location.pathname === '/profile/security/blocked-profiles') {
      return <BlockedProfiles />
    }

    if (location.pathname === '/profile/annonces') {
      return <Annonces />
    }

    if (location.pathname === '/profile/contracts') {
      return <Contracts />
    }

    if (location.pathname === '/profile/wallet') {
      return <WalletPage />
    }

    if (location.pathname === '/profile/transactions') {
      return <Transactions />
    }

    if (location.pathname === '/profile/tickets') {
      return <Tickets />
    }

    if (location.pathname === '/profile/candidature' || location.pathname === '/profile/espace-candidat') {
      return <Candidature />
    }

    // Routes pour les pages légales individuelles
    if (location.pathname === '/profile/legal/mentions-legales') {
      return <MentionsLegales />
    }
    if (location.pathname === '/profile/legal/politique-confidentialite') {
      return <PolitiqueConfidentialite />
    }
    if (location.pathname === '/profile/legal/cgu') {
      return <CGU />
    }
    if (location.pathname === '/profile/legal/cgv') {
      return <CGV />
    }
    if (location.pathname === '/profile/legal/politique-cookies') {
      return <PolitiqueCookies />
    }
    if (location.pathname === '/profile/legal/securite') {
      return <PageSecurite />
    }

    switch (currentSection) {
      case 'menu':
        return renderMenu()
      case 'public':
        if (!user) {
          return (
            <div className="profile-empty-state">
              <User size={64} />
              <h2>{t('profile:loginRequiredTitle')}</h2>
              <p>{t('profile:loginRequiredText')}</p>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/auth/login')}
              >
                {t('profile:loginButton')}
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
      case 'contact':
        return <Contact />
      case 'resources':
        return <Resources />
      case 'resources-page':
        if (location.pathname === '/profile/resources/creation-entreprise') {
          return <ResourcesBusiness />
        }
        if (location.pathname === '/profile/resources/declaration-revenus') {
          return <ResourcesIncome />
        }
        return <Resources />
      case 'legal':
        return <Legal />
      case 'annonces':
        return <Annonces />
      case 'contracts':
        return <Contracts />
      default:
        return renderMenu()
    }
  }

  const getPageTitle = () => {
    if (location.pathname === '/profile/annonces') return t('profile:annoncesTitle')
    if (location.pathname === '/profile/contracts') return t('profile:contractsTitle')
    if (location.pathname === '/profile/wallet') return t('profile:walletTitle')
    if (location.pathname === '/profile/transactions') return t('profile:transactionsTitle')
    if (location.pathname === '/profile/tickets') return t('profile:ticketsTitle')
    if (location.pathname === '/profile/candidature' || location.pathname === '/profile/espace-candidat') return t('profile:candidatureTitle')
    if (location.pathname === '/profile/help' || location.pathname.startsWith('/profile/help/')) return t('profile:helpTitle')
    if (location.pathname === '/profile/contact') return t('profile:contactTitle')
    if (location.pathname === '/profile/resources') return t('profile:resourcesTitle')
    if (location.pathname === '/profile/resources/creation-entreprise') return t('profile:resourcesBusinessTitle')
    if (location.pathname === '/profile/resources/declaration-revenus') return t('profile:resourcesIncomeTitle')
    if (location.pathname.startsWith('/profile/settings')) return t('settings:title')
    if (location.pathname.startsWith('/profile/security')) return t('profile:security')
    if (location.pathname === '/profile/legal' || location.pathname.startsWith('/profile/legal/')) return t('profile:legalTitle')
    return t('profile:accountTitle')
  }

  const renderMenu = () => {
    // Si l'utilisateur n'est pas connecté, afficher l'écran de connexion
    if (!user) {
      return (
        <div className="profile-content-not-connected">
          <User className="profile-not-connected-icon" strokeWidth={1.5} />
          <h2 className="profile-not-connected-title">{t('profile:notConnectedTitle')}</h2>
          <p className="profile-not-connected-text">{t('profile:notConnectedText')}</p>
          <button 
            className="profile-not-connected-button" 
            onClick={() => navigate('/auth/register')}
          >
            {t('profile:registerButton')}
          </button>
          <p className="profile-not-connected-login-link">
            {t('profile:alreadyAccount')}{' '}
            <button 
              className="profile-not-connected-link" 
              onClick={() => navigate('/auth/login')}
            >
              {t('profile:signInLink')}
            </button>
          </p>
        </div>
      )
    }

    // Utiliser uniquement les données de profiles (synchronisées depuis auth.users)
    // Ne pas utiliser de fallback avec l'email pour éviter les noms automatiques
    const displayName = profile?.full_name || profile?.username || t('profile:userFallback')

    // Menu items nécessitant une connexion
    const authMenuItems: MenuItem[] = [
      { 
        id: 'wallet', 
        icon: Wallet, 
        label: t('profile:wallet'), 
        path: '/profile/wallet',
        onClick: () => navigate('/profile/wallet'),
        requiresAuth: true
      },
      { 
        id: 'annonces', 
        icon: FileEdit, 
        label: t('profile:annonces'), 
        path: '/profile/annonces',
        onClick: () => navigate('/profile/annonces'),
        requiresAuth: true
      },
      { 
        id: 'contracts', 
        icon: FileText, 
        label: t('profile:contracts'), 
        path: '/profile/contracts',
        onClick: () => navigate('/profile/contracts'),
        requiresAuth: true
      },
      { 
        id: 'transactions', 
        icon: Receipt, 
        label: t('profile:transactions'), 
        path: '/profile/transactions',
        onClick: () => navigate('/profile/transactions'),
        requiresAuth: true
      },
      {
        id: 'tickets',
        icon: Ticket,
        label: t('profile:tickets'),
        path: '/profile/tickets',
        onClick: () => navigate('/profile/tickets'),
        requiresAuth: true
      },
      {
        id: 'candidature',
        icon: Briefcase,
        label: t('profile:candidature'),
        path: '/profile/espace-candidat',
        onClick: () => navigate('/profile/espace-candidat'),
        requiresAuth: true
      },
      { 
        id: 'settings', 
        icon: SettingsIcon, 
        label: t('settings:title'), 
        path: '/profile/settings',
        onClick: () => navigate('/profile/settings'),
        requiresAuth: true
      },
      { 
        id: 'security', 
        icon: Shield, 
        label: t('profile:security'), 
        path: '/profile/security',
        onClick: () => navigate('/profile/security'),
        requiresAuth: true
      },
      { 
        id: 'help', 
        icon: HelpCircle, 
        label: t('profile:help'), 
        path: '/profile/help',
        onClick: () => navigate('/profile/help'),
        requiresAuth: false
      }
    ]

    return (
      <div className="profile-menu-page">
        {/* Carte de profil */}
        <div 
          className="profile-card" 
          onClick={() => navigate('/profile/public')}
        >
          <div className="profile-card-avatar">
            {profile?.avatar_url ? (
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
            )}
          </div>
          <div className="profile-card-name">{displayName}</div>
          <ChevronRight size={20} className="profile-card-chevron" />
        </div>

        {/* Liste des options */}
        <div className="profile-menu-list">
          {authMenuItems.map((item) => {
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
                {item.subItems && (
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

        {/* Bouton de déconnexion */}
        <button
          className="profile-menu-item profile-menu-item-logout"
          onClick={handleSignOutClick}
        >
          <div className="profile-menu-item-icon">
            <LogOut size={20} />
          </div>
          <span className="profile-menu-item-label">{t('profile:logout')}</span>
        </button>

        <div className="profile-app-version">
          <span className="profile-app-version-label">Version</span>
          <span className="profile-app-version-value">{appVersion}</span>
        </div>
        <div className="profile-menu-end-spacer" />
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
                {getPageTitle()}
              </h1>
              <div className="profile-header-spacer"></div>
            </div>
          </div>
        )}

        {/* Zone scrollable */}
        <div
          className={`profile-scrollable ${
            ['wallet', 'annonces', 'contracts', 'transactions', 'tickets', 'candidature', 'settings', 'security', 'help', 'contact', 'resources', 'resources-page', 'legal', 'legal-page'].includes(
              currentSection
            )
              ? 'profile-scrollable-increased-padding'
              : ''
          }`}
        >
          {(authLoading || loading) && currentSection === 'menu' ? (
            <div className="profile-loading">Chargement...</div>
          ) : (
            renderContent()
          )}
        </div>

        {/* Modal de confirmation de déconnexion */}
        {showSignOutModal && (
          <ConfirmationModal
            visible={showSignOutModal}
            title={t('profile:logoutTitle')}
            message={t('profile:logoutMessage')}
            onConfirm={() => {
              setShowSignOutModal(false)
              handleSignOut()
            }}
            onCancel={() => setShowSignOutModal(false)}
            confirmLabel={t('profile:logoutConfirm')}
            cancelLabel={t('profile:cancel')}
          />
        )}
      </div>
    </div>
  )
}

export default Profile
