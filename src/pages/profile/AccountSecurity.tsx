import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Phone, KeyRound, Smartphone, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import PageHeader from '../../components/PageHeader'
import './AccountSecurity.css'

const AccountSecurity = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [securityStatus, setSecurityStatus] = useState({
    password: { status: 'unknown', lastModified: null as string | null },
    phone: { number: null as string | null, verified: false },
    twoFactor: false,
    devicesCount: 0
  })

  useEffect(() => {
    if (user) {
      fetchSecurityStatus()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchSecurityStatus = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Récupérer les informations du profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone, phone_verified, two_factor_enabled')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      }

      // Récupérer les sessions (appareils connectés)
      const { data: sessionsData } = await supabase.auth.getSessions()
      
      setSecurityStatus({
        password: {
          status: user.email ? 'set' : 'not_set',
          lastModified: null // Supabase ne stocke pas cette info directement
        },
        phone: {
          number: profile?.phone || null,
          verified: profile?.phone_verified || false
        },
        twoFactor: profile?.two_factor_enabled || false,
        devicesCount: sessionsData?.sessions?.length || 0
      })
    } catch (error) {
      console.error('Error in fetchSecurityStatus:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneNumber = (phone: string | null): string => {
    if (!phone) return 'Non ajouté'
    // Masquer les chiffres sauf les 2-3 derniers
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length <= 3) return phone
    const lastDigits = cleaned.slice(-2)
    const masked = '•'.repeat(cleaned.length - 2)
    return `+${cleaned.slice(0, -2)} ${masked} ${lastDigits}`
  }

  if (loading) {
    return (
      <div className="page">
        <PageHeader title="Sécurité du compte" />
        <div className="page-content">
          <div className="loading-state">Chargement...</div>
        </div>
      </div>
    )
  }

  const securityItems = [
    {
      id: 'password',
      icon: Lock,
      label: 'Mot de passe',
      status: securityStatus.password.status === 'set' ? 'Modifiable' : 'Non défini',
      path: '/profile/security/password'
    },
    {
      id: 'phone',
      icon: Phone,
      label: 'Numéro de téléphone',
      status: securityStatus.phone.verified 
        ? `Confirmé (${formatPhoneNumber(securityStatus.phone.number)})`
        : securityStatus.phone.number 
          ? `Non confirmé (${formatPhoneNumber(securityStatus.phone.number)})`
          : 'Non ajouté',
      path: '/profile/security/phone'
    },
    {
      id: 'two-factor',
      icon: KeyRound,
      label: 'Connexion à deux étapes',
      status: securityStatus.twoFactor ? 'Activée' : 'Désactivée',
      path: '/profile/security/two-factor'
    },
    {
      id: 'devices',
      icon: Smartphone,
      label: 'Appareils connectés',
      status: `${securityStatus.devicesCount} appareil${securityStatus.devicesCount > 1 ? 's' : ''}`,
      path: '/profile/security/devices'
    }
  ]

  return (
    <div className="page">
      <PageHeader title="Sécurité du compte" />
      <div className="page-content account-security-page">
        <div className="account-security-container">
          <div className="account-security-intro">
            <p className="account-security-description">
              Vue d'ensemble de la sécurité de votre compte. 
              Gérez vos paramètres de sécurité pour protéger votre compte.
            </p>
          </div>

          <div className="account-security-list">
            {securityItems.map((item) => {
              const Icon = item.icon
              const isActive = securityStatus.twoFactor && item.id === 'two-factor' || 
                              securityStatus.phone.verified && item.id === 'phone' ||
                              securityStatus.password.status === 'set' && item.id === 'password'
              
              return (
                <button
                  key={item.id}
                  className="account-security-item"
                  onClick={() => navigate(item.path)}
                >
                  <div className="account-security-item-icon">
                    <Icon size={20} />
                  </div>
                  <div className="account-security-item-content">
                    <span className="account-security-item-label">{item.label}</span>
                    <span className={`account-security-item-status ${isActive ? 'active' : ''}`}>
                      {item.status}
                    </span>
                  </div>
                  <ChevronRight size={18} className="account-security-item-chevron" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountSecurity
