import { useState, useEffect, useCallback, useMemo } from 'react'
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
    emailKey
  }: {
    label: string
    mobileKey: keyof NotificationSettings
    emailKey: keyof NotificationSettings
  }) => {
    return (
      <div className="notifications-item">
        <div className="notifications-item-title">{label}</div>
        <div className="notifications-item-row">
          <span>Recevoir une notification push</span>
          <label className="notification-switch">
            <input
              type="checkbox"
              checked={settings[mobileKey] as boolean}
              onChange={(e) => updateSetting(mobileKey, e.target.checked)}
            />
            <span className="notification-switch-slider"></span>
          </label>
        </div>
        <div className="notifications-item-row">
          <span>Recevoir un email</span>
          <label className="notification-switch">
            <input
              type="checkbox"
              checked={settings[emailKey] as boolean}
              onChange={(e) => updateSetting(emailKey, e.target.checked)}
            />
            <span className="notification-switch-slider"></span>
          </label>
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
          <div className="notifications-group">
            <div className="notifications-group-header">
              <h3>Notifications téléphone</h3>
            </div>
            <div className="notifications-item">
              <div className="notifications-item-row">
                <span>Recevoir une notification push</span>
                <label className="notification-switch">
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={handleTogglePush}
                    disabled={!pushSupported || pushLoading}
                  />
                  <span className="notification-switch-slider"></span>
                </label>
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
          {/* Section A - Messagerie */}
          <div className="notifications-group">
            <div className="notifications-group-header">
              <h3>Messagerie</h3>
            </div>
            <NotificationToggle
              label="Nouveau message"
              mobileKey="message_mobile"
              emailKey="message_email"
            />
          </div>

          {/* Section B - Annonces */}
          <div className="notifications-group">
            <div className="notifications-group-header">
              <h3>Annonces</h3>
            </div>
            <NotificationToggle
              label="Like sur une annonce"
              mobileKey="like_mobile"
              emailKey="like_email"
            />
            <NotificationToggle
              label="Demande reçue (match / demande de collaboration)"
              mobileKey="request_received_mobile"
              emailKey="request_received_email"
            />
            <NotificationToggle
              label="Demande acceptée"
              mobileKey="request_accepted_mobile"
              emailKey="request_accepted_email"
            />
            <NotificationToggle
              label="Commentaire sur mon profil"
              mobileKey="profile_comment_mobile"
              emailKey="profile_comment_email"
            />
          </div>

          {/* Section C - Offres, actualités et conseils */}
          <div className="notifications-group">
            <div className="notifications-group-header">
              <h3>Offres, actualités et conseils</h3>
            </div>
            <NotificationToggle
              label="Offres / promotions"
              mobileKey="offers_mobile"
              emailKey="offers_email"
            />
            <NotificationToggle
              label="Actualités de l'application"
              mobileKey="news_mobile"
              emailKey="news_email"
            />
            <NotificationToggle
              label="Conseils / recommandations"
              mobileKey="tips_mobile"
              emailKey="tips_email"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
