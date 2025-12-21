import { useState, useEffect } from 'react'
import { Bell, MessageSquare, FileText, Heart, MessageCircle, UserCheck, CheckCircle, Mail, Smartphone } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
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

  useEffect(() => {
    if (user) {
      fetchSettings()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchSettings = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Récupérer les préférences depuis la table profiles ou une table dédiée
      // Pour l'instant, on utilise un champ JSONB dans profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification settings:', error)
      } else if ((data as any)?.notification_preferences) {
        setSettings({ ...defaultSettings, ...(data as any).notification_preferences })
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error)
    } finally {
      setLoading(false)
    }
  }


  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    // Sauvegarder automatiquement
    if (user) {
      try {
        await (supabase.from('profiles') as any)
          .update({ 
            notification_preferences: newSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
      } catch (error) {
        console.error('Error auto-saving notification settings:', error)
        // Revenir à l'état précédent en cas d'erreur
        setSettings(settings)
      }
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
