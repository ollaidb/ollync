import { useState, useEffect, useCallback, useMemo } from 'react'
import { Bell, MessageSquare, FileText, Heart, MessageCircle, UserCheck, CheckCircle, Mail, Smartphone, Radio } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import { disablePushForUser, enablePushForUser, getPushPermission, isPushEnabled } from '../../utils/pushNotifications'
import PageHeader from '../../components/PageHeader'
import './Notifications.css'

interface NotificationSettings {
  // Section A - Messagerie
  message_mobile: boolean
  message_email: boolean
  
  // Section B - Annonces
  like_mobile: boolean
  like_email: boolean
  request_received_mobile: boolean
  request_received_email: boolean
  request_accepted_mobile: boolean
  request_accepted_email: boolean
  profile_comment_mobile: boolean
  profile_comment_email: boolean
  
  // Section C - Offres, actualités et conseils
  offers_mobile: boolean
  offers_email: boolean
  news_mobile: boolean
  news_email: boolean
  tips_mobile: boolean
  tips_email: boolean
}

const defaultSettings: NotificationSettings = {
  // Messagerie
  message_mobile: true,
  message_email: true,
  
  // Annonces
  like_mobile: true,
  like_email: false,
  request_received_mobile: true,
  request_received_email: true,
  request_accepted_mobile: true,
  request_accepted_email: true,
  profile_comment_mobile: true,
  profile_comment_email: false,
  
  // Offres, actualités et conseils
  offers_mobile: false,
  offers_email: false,
  news_mobile: true,
  news_email: false,
  tips_mobile: false,
  tips_email: false
}

const Notifications = () => {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [pushSupported, setPushSupported] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushPermission, setPushPermission] = useState<string>('default')
  const [pushError, setPushError] = useState<string | null>(null)
  const [pushLoading, setPushLoading] = useState(false)

  const profilesTable = useMemo(() => {
    return supabase.from('profiles') as unknown as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{
            data: { notification_preferences?: Partial<NotificationSettings> | null } | null
            error: { code?: string } | null
          }>
        }
      }
      update: (values: Record<string, unknown>) => {
        eq: (column: string, value: string) => Promise<{ error: unknown | null }>
      }
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      // Récupérer les préférences depuis la table profiles ou une table dédiée
      // Pour l'instant, on utilise un champ JSONB dans profiles
      const { data, error } = await profilesTable
        .select('notification_preferences')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification settings:', error)
      } else {
        const row = data as { notification_preferences?: Partial<NotificationSettings> | null } | null
        if (row?.notification_preferences) {
          setSettings({ ...defaultSettings, ...row.notification_preferences })
        }
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error)
    } finally {
      setLoading(false)
    }
  }, [user, profilesTable])

  useEffect(() => {
    if (user) {
      fetchSettings()
    } else {
      setLoading(false)
    }
  }, [user, fetchSettings])

  useEffect(() => {
    const permission = getPushPermission()
    setPushPermission(permission)
    setPushSupported(permission !== 'unsupported')
    if (user) {
      isPushEnabled()
        .then(setPushEnabled)
        .catch(() => setPushEnabled(false))
    }
  }, [user])


  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    // Sauvegarder automatiquement
    if (user) {
      try {
        const { error } = await profilesTable
          .update({
            notification_preferences: newSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
        if (error) {
          throw error
        }
      } catch (error) {
        console.error('Error auto-saving notification settings:', error)
        // Revenir à l'état précédent en cas d'erreur
        setSettings(settings)
      }
    }
  }

  const handleTogglePush = async () => {
    if (!user) return
    setPushLoading(true)
    setPushError(null)

    try {
      if (pushEnabled) {
        await disablePushForUser(user.id)
        setPushEnabled(false)
      } else {
        await enablePushForUser(user.id)
        setPushEnabled(true)
      }
    } catch (error) {
      setPushError(error instanceof Error ? error.message : 'Activation impossible.')
    } finally {
      setPushPermission(getPushPermission())
      setPushLoading(false)
    }
  }

  const NotificationToggle = ({ 
    label, 
    mobileKey, 
    emailKey, 
    icon: Icon 
  }: { 
    label: string
    mobileKey: keyof NotificationSettings
    emailKey: keyof NotificationSettings
    icon: typeof Bell
  }) => {
    return (
      <div className="notification-item">
        <div className="notification-item-header">
          <Icon size={18} />
          <span className="notification-item-label">{label}</span>
        </div>
        <div className="notification-item-toggles">
          <div className="notification-toggle-group">
            <Smartphone size={16} />
            <label className="notification-toggle">
              <input
                type="checkbox"
                checked={settings[mobileKey] as boolean}
                onChange={(e) => updateSetting(mobileKey, e.target.checked)}
              />
              <span className="notification-toggle-slider"></span>
            </label>
            <span className="notification-toggle-label">Mobile</span>
          </div>
          <div className="notification-toggle-group">
            <Mail size={16} />
            <label className="notification-toggle">
              <input
                type="checkbox"
                checked={settings[emailKey] as boolean}
                onChange={(e) => updateSetting(emailKey, e.target.checked)}
              />
              <span className="notification-toggle-slider"></span>
            </label>
            <span className="notification-toggle-label">E-mail</span>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page">
        <PageHeader title="Notifications" />
        <div className="page-content">
          <div className="loading-state">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Notifications" />
      <div className="page-content notifications-settings-page">
        <div className="notifications-settings-container">
          <div className="notifications-section">
            <h3 className="notifications-section-title">
              <Radio size={20} />
              Notifications téléphone
            </h3>
            <div className="notifications-list">
              <div className="notification-item">
                <div className="notification-item-header">
                  <Smartphone size={18} />
                  <span className="notification-item-label">Activer les push sur ce téléphone</span>
                </div>
                <div className="notification-item-toggles">
                  <div className="notification-toggle-group">
                    <Smartphone size={16} />
                    <label className="notification-toggle">
                      <input
                        type="checkbox"
                        checked={pushEnabled}
                        onChange={handleTogglePush}
                        disabled={!pushSupported || pushLoading}
                      />
                      <span className="notification-toggle-slider"></span>
                    </label>
                    <span className="notification-toggle-label">Push</span>
                  </div>
                </div>
                {!pushSupported && (
                  <p className="notification-push-note">Push non supporté sur ce navigateur.</p>
                )}
                {pushPermission === 'denied' && (
                  <p className="notification-push-note">Autorisation refusée dans le navigateur.</p>
                )}
                {pushError && <p className="notification-push-error">{pushError}</p>}
              </div>
            </div>
          </div>
          {/* Section A - Messagerie */}
          <div className="notifications-section">
            <h3 className="notifications-section-title">
              <MessageSquare size={20} />
              Messagerie
            </h3>
            <div className="notifications-list">
              <NotificationToggle
                label="Nouveau message"
                mobileKey="message_mobile"
                emailKey="message_email"
                icon={MessageSquare}
              />
            </div>
          </div>

          {/* Section B - Annonces */}
          <div className="notifications-section">
            <h3 className="notifications-section-title">
              <FileText size={20} />
              Annonces
            </h3>
            <div className="notifications-list">
              <NotificationToggle
                label="Like sur une annonce"
                mobileKey="like_mobile"
                emailKey="like_email"
                icon={Heart}
              />
              <NotificationToggle
                label="Demande reçue (match / demande de collaboration)"
                mobileKey="request_received_mobile"
                emailKey="request_received_email"
                icon={UserCheck}
              />
              <NotificationToggle
                label="Demande acceptée"
                mobileKey="request_accepted_mobile"
                emailKey="request_accepted_email"
                icon={CheckCircle}
              />
              <NotificationToggle
                label="Commentaire sur mon profil"
                mobileKey="profile_comment_mobile"
                emailKey="profile_comment_email"
                icon={MessageCircle}
              />
            </div>
          </div>

          {/* Section C - Offres, actualités et conseils */}
          <div className="notifications-section">
            <h3 className="notifications-section-title">
              <Bell size={20} />
              Offres, actualités et conseils
            </h3>
            <div className="notifications-list">
              <NotificationToggle
                label="Offres / promotions"
                mobileKey="offers_mobile"
                emailKey="offers_email"
                icon={Bell}
              />
              <NotificationToggle
                label="Actualités de l'application"
                mobileKey="news_mobile"
                emailKey="news_email"
                icon={FileText}
              />
              <NotificationToggle
                label="Conseils / recommandations"
                mobileKey="tips_mobile"
                emailKey="tips_email"
                icon={Bell}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Notifications
