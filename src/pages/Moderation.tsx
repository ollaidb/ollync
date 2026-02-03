import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Flag, ShieldAlert, Trash2, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import BackButton from '../components/BackButton'
import ConfirmationModal from '../components/ConfirmationModal'
import { EmptyState } from '../components/EmptyState'
import './Moderation.css'

const MODERATOR_EMAIL = 'binta22116@gmail.com'

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'
type ReportType = 'profile' | 'post'

interface ReportRelationProfile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  email: string | null
}

interface ReportRelationPost {
  id: string
  title: string
  description: string
  created_at: string
  user_id: string
}

interface ModerationReport {
  id: string
  report_type: ReportType
  report_reason: string
  report_category: string | null
  description: string | null
  status: ReportStatus
  created_at: string
  reporter: ReportRelationProfile | null
  reported_user: ReportRelationProfile | null
  reported_post: ReportRelationPost | null
}

type FilterType = 'all' | 'pending' | 'profile' | 'post'

const Moderation = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('pending')
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete_profile' | 'delete_post'
    report: ModerationReport
  } | null>(null)

  const isModerator = useMemo(() => {
    return (user?.email || '').trim().toLowerCase() === MODERATOR_EMAIL
  }, [user?.email])

  const fetchReports = useCallback(async () => {
    if (!user || !isModerator) {
      setReportsLoading(false)
      return
    }

    setReportsLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('reports') as any)
      .select(`
        id,
        report_type,
        report_reason,
        report_category,
        description,
        status,
        created_at,
        reporter:profiles!reports_reporter_id_fkey(id, username, full_name, avatar_url, email),
        reported_user:profiles!reports_reported_user_id_fkey(id, username, full_name, avatar_url, email),
        reported_post:posts!reports_reported_post_id_fkey(id, title, description, created_at, user_id)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reports:', error)
      setReports([])
    } else {
      setReports((data as ModerationReport[]) || [])
    }
    setReportsLoading(false)
  }, [user, isModerator])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'pending') return report.status === 'pending'
      if (activeFilter === 'profile') return report.report_type === 'profile'
      if (activeFilter === 'post') return report.report_type === 'post'
      return true
    })
  }, [reports, activeFilter])

  const updateReportStatus = async (report: ModerationReport, status: ReportStatus) => {
    if (!user || !isModerator) return
    setActionLoading(report.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('reports') as any)
      .update({ status })
      .eq('id', report.id)

    if (error) {
      console.error('Error updating report status:', error)
    } else {
      setReports((prev) =>
        prev.map((item) => (item.id === report.id ? { ...item, status } : item))
      )
    }
    setActionLoading(null)
  }

  const handleDeletePost = async (report: ModerationReport) => {
    if (!report.reported_post) return
    setActionLoading(report.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('delete_post_as_admin', {
      target_post_id: report.reported_post.id
    })

    if (error) {
      console.error('Error deleting post:', error)
    } else {
      setReports((prev) =>
        prev.map((item) =>
          item.id === report.id ? { ...item, status: 'resolved' } : item
        )
      )
    }
    setActionLoading(null)
  }

  const handleDeleteProfile = async (report: ModerationReport) => {
    if (!report.reported_user) return
    setActionLoading(report.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('delete_profile_as_admin', {
      target_profile_id: report.reported_user.id
    })

    if (error) {
      console.error('Error deleting profile:', error)
    } else {
      setReports((prev) =>
        prev.map((item) =>
          item.id === report.id ? { ...item, status: 'resolved' } : item
        )
      )
    }
    setActionLoading(null)
  }

  if (loading) {
    return (
      <div className="moderation-page">
        <div className="moderation-loading">Chargement...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="moderation-page">
        <div className="moderation-locked">
          <ShieldAlert size={48} />
          <h2>Acces reserve</h2>
          <p>Connectez-vous avec le compte autorise.</p>
          <button className="moderation-primary-btn" onClick={() => navigate('/auth/login')}>
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  if (!isModerator) {
    return (
      <div className="moderation-page">
        <div className="moderation-locked">
          <ShieldAlert size={48} />
          <h2>Acces refuse</h2>
          <p>Cette page est disponible uniquement pour le compte modere.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="moderation-page">
      <div className="moderation-header">
        <BackButton />
        <h1>Moderation</h1>
        <div className="moderation-header-spacer" />
      </div>

      <div className="moderation-filters">
        <button
          className={`moderation-filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveFilter('pending')}
        >
          En attente
        </button>
        <button
          className={`moderation-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Tous
        </button>
        <button
          className={`moderation-filter-btn ${activeFilter === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveFilter('profile')}
        >
          Profils
        </button>
        <button
          className={`moderation-filter-btn ${activeFilter === 'post' ? 'active' : ''}`}
          onClick={() => setActiveFilter('post')}
        >
          Annonces
        </button>
      </div>

      {reportsLoading ? (
        <div className="moderation-loading">Chargement des signalements...</div>
      ) : filteredReports.length === 0 ? (
        <div className="moderation-empty">
          <EmptyState
            type="category"
            customIcon={Flag}
            customTitle="Aucun signalement"
            customSubtext="Les signalements apparaitront ici."
          />
        </div>
      ) : (
        <div className="moderation-list">
          {filteredReports.map((report) => {
            const isProfileReport = report.report_type === 'profile'
            const isLoadingAction = actionLoading === report.id
            const reportedName =
              report.reported_user?.full_name ||
              report.reported_user?.username ||
              report.reported_user?.email ||
              'Utilisateur'
            const reporterName =
              report.reporter?.full_name ||
              report.reporter?.username ||
              report.reporter?.email ||
              'Utilisateur'

            return (
              <div key={report.id} className="moderation-card">
                <div className="moderation-card-header">
                  <div className="moderation-card-title">
                    <AlertTriangle size={18} />
                    <span>{isProfileReport ? 'Signalement profil' : 'Signalement annonce'}</span>
                  </div>
                  <div className={`moderation-status moderation-status-${report.status}`}>
                    {report.status}
                  </div>
                </div>

                <div className="moderation-card-body">
                  <div className="moderation-meta">
                    <span>Raison: {report.report_reason}</span>
                    {report.report_category && <span>Categorie: {report.report_category}</span>}
                    <span>
                      {new Date(report.created_at).toLocaleDateString('fr-FR')} ·{' '}
                      {new Date(report.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {report.description && (
                    <p className="moderation-description">{report.description}</p>
                  )}

                  <div className="moderation-entities">
                    <div>
                      <div className="moderation-entity-label">Auteur du signalement</div>
                      <div className="moderation-entity-value">{reporterName}</div>
                    </div>
                    <div>
                      <div className="moderation-entity-label">
                        {isProfileReport ? 'Profil signale' : 'Annonce signalee'}
                      </div>
                      <div className="moderation-entity-value">
                        {isProfileReport
                          ? reportedName
                          : report.reported_post?.title || 'Annonce'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="moderation-card-actions">
                  {isProfileReport ? (
                    <button
                      className="moderation-action destructive"
                      onClick={() => setConfirmAction({ type: 'delete_profile', report })}
                      disabled={!report.reported_user || isLoadingAction}
                    >
                      <Trash2 size={16} />
                      Supprimer profil
                    </button>
                  ) : (
                    <button
                      className="moderation-action destructive"
                      onClick={() => setConfirmAction({ type: 'delete_post', report })}
                      disabled={!report.reported_post || isLoadingAction}
                    >
                      <Trash2 size={16} />
                      Supprimer annonce
                    </button>
                  )}
                  <button
                    className="moderation-action"
                    onClick={() => updateReportStatus(report, 'reviewed')}
                    disabled={isLoadingAction}
                  >
                    <CheckCircle2 size={16} />
                    Marquer examine
                  </button>
                  <button
                    className="moderation-action"
                    onClick={() => updateReportStatus(report, 'resolved')}
                    disabled={isLoadingAction}
                  >
                    <CheckCircle2 size={16} />
                    Resolu
                  </button>
                  <button
                    className="moderation-action muted"
                    onClick={() => updateReportStatus(report, 'dismissed')}
                    disabled={isLoadingAction}
                  >
                    <XCircle size={16} />
                    Ignorer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmationModal
        visible={!!confirmAction}
        title="Confirmation"
        message={
          confirmAction?.type === 'delete_profile'
            ? 'Vous allez supprimer definitivement ce profil et toutes ses donnees.'
            : 'Vous allez supprimer definitivement cette annonce.'
        }
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        isDestructive={true}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return
          const { type, report } = confirmAction
          setConfirmAction(null)
          if (type === 'delete_profile') {
            handleDeleteProfile(report)
          } else {
            handleDeletePost(report)
          }
        }}
      />
    </div>
  )
}

export default Moderation
