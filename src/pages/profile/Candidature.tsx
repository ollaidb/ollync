import { ChangeEvent, useEffect, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useSupabase'
import { supabase } from '../../lib/supabaseClient'
import './Candidature.css'

type TabType = 'sent' | 'profile'

interface CandidateData {
  cvUrl: string
  coverLetterUrl: string
}

interface SentApplication {
  id: string
  title: string
  status: string
  createdAt: string
}

const Candidature = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [candidate, setCandidate] = useState<CandidateData>({
    cvUrl: '',
    coverLetterUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingCoverLetter, setUploadingCoverLetter] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sentApplications, setSentApplications] = useState<SentApplication[]>([])

  useEffect(() => {
    const loadCandidateProfile = async () => {
      if (!user) return
      setError(null)
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles' as never)
          .select('*')
          .eq('id', user.id)
          .single()

        if (fetchError) throw fetchError

        const profileData = (data || {}) as Record<string, unknown>
        setCandidate({
          cvUrl: String(profileData.candidate_cv_url || ''),
          coverLetterUrl: String(profileData.candidate_cover_letter_url || '')
        })
      } catch (loadError) {
        console.error('Error loading candidature profile:', loadError)
        setError('Impossible de charger la page candidature.')
      }
    }

    loadCandidateProfile()
  }, [user])

  useEffect(() => {
    const loadSentApplications = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('candidate_applications' as never)
          .select('id, title, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        setSentApplications(
          ((data || []) as Array<Record<string, unknown>>).map((item) => ({
            id: String(item.id),
            title: String(item.title || 'Candidature'),
            status: String(item.status || 'pending'),
            createdAt: String(item.created_at || '')
          }))
        )
      } catch (error) {
        console.error('Error loading sent applications:', error)
        setSentApplications([])
      }
    }

    loadSentApplications()
  }, [user])

  const handleUploadCv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const extension = file.name.split('.').pop() || 'pdf'
      const filePath = `${user.id}/cv-${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath)

      setCandidate((prev) => ({ ...prev, cvUrl: publicData.publicUrl }))
      setSuccess('CV téléversé avec succès.')
    } catch (uploadError) {
      console.error('Error uploading CV:', uploadError)
      setError('Impossible de téléverser le CV.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleUploadCoverLetter = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    setUploadingCoverLetter(true)
    setError(null)
    setSuccess(null)

    try {
      const extension = file.name.split('.').pop() || 'pdf'
      const filePath = `${user.id}/cover-letter-${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath)

      setCandidate((prev) => ({ ...prev, coverLetterUrl: publicData.publicUrl }))
      setSuccess('Lettre de motivation téléversée avec succès.')
    } catch (uploadError) {
      console.error('Error uploading cover letter:', uploadError)
      setError('Impossible de téléverser la lettre de motivation.')
    } finally {
      setUploadingCoverLetter(false)
      event.target.value = ''
    }
  }

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { error: saveError } = await supabase
        .from('profiles' as never)
        .update({
          candidate_cv_url: candidate.cvUrl || null,
          candidate_cover_letter_url: candidate.coverLetterUrl || null
        } as never)
        .eq('id', user.id)

      if (saveError) throw saveError
      setSuccess('Candidature enregistrée.')
    } catch (saveError) {
      console.error('Error saving candidature data:', saveError)
      setError('Impossible d’enregistrer. Exécute la migration SQL puis réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="candidature-page">
      <div className="candidature-tabs">
        <button
          type="button"
          className={`candidature-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profil
        </button>
        <button
          type="button"
          className={`candidature-tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Candidatures
        </button>
      </div>

      {error && <div className="candidature-error">{error}</div>}
      {success && <div className="candidature-success">{success}</div>}

      {activeTab === 'sent' ? (
        sentApplications.length === 0 ? (
          <div className="candidature-empty">
            <p>Aucune candidature envoyée pour le moment.</p>
            <span>Vos candidatures apparaîtront ici.</span>
          </div>
        ) : (
          <div className="candidature-sent-list">
            {sentApplications.map((application) => (
              <div className="candidature-sent-item" key={application.id}>
                <div className="candidature-sent-main">
                  <span className="candidature-sent-title">{application.title}</span>
                  <span className={`candidature-status status-${application.status}`}>
                    {application.status}
                  </span>
                </div>
                <span className="candidature-sent-date">
                  {application.createdAt
                    ? new Date(application.createdAt).toLocaleDateString('fr-FR')
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="candidature-form">
          <div className="candidature-field">
            <label>CV</label>
            <div className="candidature-cv-row">
              <label className="candidature-upload-btn" htmlFor="candidate-cv-input">
                {uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                {uploading ? 'Envoi...' : 'Téléverser un CV'}
              </label>
              <input
                id="candidate-cv-input"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleUploadCv}
                hidden
              />
              {candidate.cvUrl && (
                <a href={candidate.cvUrl} target="_blank" rel="noreferrer" className="candidature-cv-link">
                  Voir le CV
                </a>
              )}
            </div>
          </div>

          <div className="candidature-field">
            <label>Lettre de motivation</label>
            <div className="candidature-cv-row">
              <label className="candidature-upload-btn" htmlFor="candidate-cover-letter-input">
                {uploadingCoverLetter ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                {uploadingCoverLetter ? 'Envoi...' : 'Téléverser une lettre'}
              </label>
              <input
                id="candidate-cover-letter-input"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleUploadCoverLetter}
                hidden
              />
              {candidate.coverLetterUrl && (
                <a
                  href={candidate.coverLetterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="candidature-cv-link"
                >
                  Voir la lettre
                </a>
              )}
            </div>
          </div>

          <button type="button" className="candidature-save-btn" onClick={handleSave} disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Candidature
