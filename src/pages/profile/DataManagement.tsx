import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Shield } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import PageHeader from '../../components/PageHeader'
import './DataManagement.css'

const DataManagement = () => {
  const { user } = useAuth()
  const [dataConsent, setDataConsent] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchConsent()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchConsent = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('data_consent_enabled')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching data consent:', error)
      } else {
        setDataConsent((data as any)?.data_consent_enabled || false)
      }
    } catch (error) {
      console.error('Error in fetchConsent:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleConsent = async () => {
    if (!user) return

    const newConsent = !dataConsent
    setDataConsent(newConsent)

    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({ 
          data_consent_enabled: newConsent,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating data consent:', error)
        // Revenir à l'état précédent en cas d'erreur
        setDataConsent(!newConsent)
        alert('Erreur lors de la mise à jour du consentement')
      }
    } catch (error) {
      console.error('Error in toggleConsent:', error)
      setDataConsent(!newConsent)
      alert('Erreur lors de la mise à jour du consentement')
    }
  }

  if (loading) {
    return (
      <div className="page">
        <PageHeader title="Gestion de mes données" />
        <div className="page-content">
          <div className="loading-state">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Gestion de mes données" />
      <div className="page-content data-management-page">
        <div className="data-management-container">
          {/* Bloc principal de consentement */}
          <div className="data-consent-block">
            <div className="data-consent-header">
              <div className="data-consent-info">
                <Shield size={24} className="data-consent-icon" />
                <div className="data-consent-text">
                  <h3 className="data-consent-title">Utilisation de mes données</h3>
                  <p className="data-consent-subtitle">
                    Autoriser l'utilisation de vos données pour améliorer votre expérience, 
                    les propositions de contenu, l'agora et les fonctionnalités de l'application.
                  </p>
                </div>
              </div>
              <label className="data-consent-toggle">
                <input
                  type="checkbox"
                  checked={dataConsent}
                  onChange={toggleConsent}
                />
                <span className="data-consent-toggle-slider"></span>
              </label>
            </div>

            {/* Bouton Lire plus */}
            <button
              className="data-consent-read-more"
              onClick={() => setShowDetails(!showDetails)}
            >
              <span>Lire plus</span>
              {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {/* Détails dépliables */}
            {showDetails && (
              <div className="data-consent-details">
                <div className="data-consent-detail-section">
                  <h4 className="data-consent-detail-title">Expérience utilisateur</h4>
                  <p className="data-consent-detail-text">
                    Utilisation de vos données pour personnaliser votre expérience dans l'application, 
                    notamment pour les recommandations de contenu et d'annonces adaptées à vos préférences.
                  </p>
                </div>

                <div className="data-consent-detail-section">
                  <h4 className="data-consent-detail-title">Propositions et suggestions</h4>
                  <p className="data-consent-detail-text">
                    Utilisation de vos données pour vous proposer du contenu pertinent, améliorer les 
                    suggestions de matching et les recommandations basées sur votre activité et vos intérêts.
                  </p>
                </div>

                <div className="data-consent-detail-section">
                  <h4 className="data-consent-detail-title">Agora et interactions</h4>
                  <p className="data-consent-detail-text">
                    Affichage de votre profil et activité dans l'espace communautaire (agora), 
                    et utilisation de vos interactions pour améliorer l'expérience communautaire.
                  </p>
                </div>

                <div className="data-consent-detail-section">
                  <h4 className="data-consent-detail-title">Données analytiques</h4>
                  <p className="data-consent-detail-text">
                    Collecte et analyse de données sur votre utilisation de l'application pour 
                    améliorer les fonctionnalités, corriger les bugs et développer de nouvelles fonctionnalités.
                  </p>
                </div>

                <div className="data-consent-footer">
                  <p className="data-consent-note">
                    <strong>Note importante :</strong> Certaines fonctionnalités de base de l'application 
                    peuvent nécessiter l'utilisation minimale de vos données. Vous pouvez modifier ce paramètre 
                    à tout moment dans les paramètres.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataManagement

