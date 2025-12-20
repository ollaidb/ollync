import { useState, useEffect } from 'react'
import { Smartphone, Monitor, Tablet, LogOut, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import PageHeader from '../../components/PageHeader'
import './ConnectedDevices.css'

interface Device {
  id: string
  user_agent?: string
  created_at?: string
  last_activity?: string
  isCurrent?: boolean
}

const ConnectedDevices = () => {
  const { user } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchDevices()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchDevices = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Récupérer toutes les sessions actives
      const { data: sessionsData, error } = await supabase.auth.getSessions()
      
      if (error) {
        console.error('Error fetching sessions:', error)
        setDevices([])
      } else {
        // Transformer les sessions en appareils
        const sessions = sessionsData?.sessions || []
        const devicesList: Device[] = sessions.map((session, index) => {
          // Récupérer le user_agent depuis les métadonnées de la session si disponible
          const userAgent = session.user?.user_metadata?.user_agent || 
                          navigator.userAgent || 
                          'Appareil inconnu'
          const deviceInfo = parseUserAgent(userAgent)
          
          return {
            id: session.access_token || `device-${index}`,
            user_agent: userAgent,
            created_at: session.created_at,
            last_activity: session.expires_at,
            isCurrent: index === 0 // La première session est généralement l'appareil actuel
          }
        })
        
        setDevices(devicesList)
      }
    } catch (error) {
      console.error('Error in fetchDevices:', error)
      setDevices([])
    } finally {
      setLoading(false)
    }
  }

  const parseUserAgent = (userAgent: string) => {
    // Détection basique du type d'appareil
    if (!userAgent) return { type: 'Appareil', browser: 'Inconnu' }
    
    let type = 'Appareil'
    let browser = 'Inconnu'
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      if (userAgent.includes('iPhone')) {
        type = 'iPhone'
      } else if (userAgent.includes('iPad')) {
        type = 'iPad'
      } else if (userAgent.includes('Android')) {
        type = 'Android'
      } else {
        type = 'Mobile'
      }
    } else {
      type = 'Ordinateur'
    }
    
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'
    
    return { type, browser }
  }

  const getDeviceIcon = (type: string) => {
    if (type.includes('iPhone') || type.includes('Android') || type === 'Mobile') {
      return Smartphone
    } else if (type === 'iPad' || type === 'Tablet') {
      return Tablet
    } else {
      return Monitor
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Inconnu'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Inconnu'
    }
  }

  const handleDisconnectDevice = async (deviceId: string) => {
    if (!user || !deviceId) return

    if (devices.find(d => d.id === deviceId)?.isCurrent) {
      alert('Vous ne pouvez pas déconnecter l\'appareil actuel depuis cette page.')
      return
    }

    if (!window.confirm('Êtes-vous sûr de vouloir déconnecter cet appareil ?')) {
      return
    }

    setDisconnecting(deviceId)
    try {
      // Note: Supabase ne permet pas de déconnecter une session spécifique directement
      // On peut seulement déconnecter toutes les sessions sauf la session actuelle
      // Pour une vraie gestion par appareil, il faudrait une table dédiée
      alert('La déconnexion d\'un appareil spécifique nécessite une configuration supplémentaire. Utilisez "Déconnecter tous les appareils" pour l\'instant.')
      setDisconnecting(null)
    } catch (error) {
      console.error('Error in handleDisconnectDevice:', error)
      alert('Erreur lors de la déconnexion de l\'appareil')
      setDisconnecting(null)
    }
  }

  const handleDisconnectAll = async () => {
    if (!user) return

    if (!window.confirm('Êtes-vous sûr de vouloir déconnecter tous les appareils ? Vous devrez vous reconnecter.')) {
      return
    }

    setDisconnecting('all')
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Error disconnecting all devices:', error)
        alert('Erreur lors de la déconnexion')
      } else {
        // Rediriger vers la page de connexion
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Error in handleDisconnectAll:', error)
      alert('Erreur lors de la déconnexion')
    } finally {
      setDisconnecting(null)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <PageHeader title="Appareils connectés" />
        <div className="page-content">
          <div className="loading-state">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Appareils connectés" />
      <div className="page-content connected-devices-page">
        <div className="connected-devices-container">
          {devices.length === 0 ? (
            <div className="devices-empty">
              <Smartphone size={48} />
              <p>Aucun appareil connecté</p>
            </div>
          ) : (
            <>
              <div className="devices-list">
                {devices.map((device) => {
                  const deviceInfo = parseUserAgent(device.user_agent || '')
                  const DeviceIcon = getDeviceIcon(deviceInfo.type)
                  
                  return (
                    <div 
                      key={device.id} 
                      className={`device-item ${device.isCurrent ? 'current' : ''}`}
                    >
                      <div className="device-item-content">
                        <div className="device-item-icon">
                          <DeviceIcon size={24} />
                        </div>
                        <div className="device-item-info">
                          <div className="device-item-header">
                            <span className="device-item-type">{deviceInfo.type}</span>
                            {device.isCurrent && (
                              <span className="device-item-current-badge">Appareil actuel</span>
                            )}
                          </div>
                          <span className="device-item-browser">{deviceInfo.browser}</span>
                          <span className="device-item-date">
                            Dernière activité : {formatDate(device.last_activity)}
                          </span>
                        </div>
                      </div>
                      {!device.isCurrent && (
                        <button
                          className="device-disconnect-button"
                          onClick={() => handleDisconnectDevice(device.id)}
                          disabled={disconnecting === device.id}
                        >
                          {disconnecting === device.id ? (
                            'Déconnexion...'
                          ) : (
                            <>
                              <LogOut size={16} />
                              <span>Déconnecter</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {devices.length > 1 && (
                <div className="devices-actions">
                  <button
                    className="devices-disconnect-all-button"
                    onClick={handleDisconnectAll}
                    disabled={disconnecting === 'all'}
                  >
                    {disconnecting === 'all' ? (
                      'Déconnexion...'
                    ) : (
                      <>
                        <LogOut size={18} />
                        <span>Déconnecter tous les appareils</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConnectedDevices

