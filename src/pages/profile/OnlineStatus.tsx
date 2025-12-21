import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import PageHeader from '../../components/PageHeader'
import './OnlineStatus.css'

const OnlineStatus = () => {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchOnlineStatus()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchOnlineStatus = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_online')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching online status:', error)
      } else {
        setIsOnline((data as any)?.is_online || false)
      }
    } catch (error) {
      console.error('Error in fetchOnlineStatus:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleOnlineStatus = async () => {
    if (!user) return

    const newStatus = !isOnline
    setIsOnline(newStatus)

    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({ 
          is_online: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating online status:', error)
        // Revenir à l'état précédent en cas d'erreur
        setIsOnline(!newStatus)
        alert('Erreur lors de la mise à jour du statut')
      }
    } catch (error) {
      console.error('Error in toggleOnlineStatus:', error)
      setIsOnline(!newStatus)
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  if (loading) {
    return (
      <div className="page">
        <PageHeader title="Statut en ligne" />
        <div className="page-content">
          <div className="loading-state">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Statut en ligne" />
      <div className="page-content online-status-page">
        <div className="online-status-container">
          <div className="online-status-section">
            <h3 className="online-status-title">Visibilité</h3>
            <p className="online-status-description">
              Activez le mode en ligne pour que les autres utilisateurs puissent voir que vous êtes disponible.
            </p>
            
            <div className="online-status-toggle-container">
              <div className="online-status-info">
                {isOnline ? (
                  <>
                    <Wifi size={24} className="online-status-icon online" />
                    <div className="online-status-text">
                      <span className="online-status-label">Mode en ligne activé</span>
                      <span className="online-status-subtitle">Les autres utilisateurs peuvent voir que vous êtes en ligne</span>
                    </div>
                  </>
                ) : (
                  <>
                    <WifiOff size={24} className="online-status-icon offline" />
                    <div className="online-status-text">
                      <span className="online-status-label">Mode en ligne désactivé</span>
                      <span className="online-status-subtitle">Votre statut n'est pas visible par les autres utilisateurs</span>
                    </div>
                  </>
                )}
              </div>

              <label className="online-status-toggle">
                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={toggleOnlineStatus}
                />
                <span className="online-status-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnlineStatus

