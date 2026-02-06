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

type FilterType = 'all' | 'profile' | 'post'
type StatusFilter = 'all' | 'pending'

const Moderation = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('profile')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
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
      if (activeFilter !== 'all' && report.report_type !== activeFilter) return false
      if (statusFilter === 'pending' && report.status !== 'pending') return false
      return true
    })
  }, [reports, activeFilter, statusFilter])

  const profileReportsCount = useMemo(
    () => reports.filter((report) => report.report_type === 'profile').length,
    [reports]
  )
  const postReportsCount = useMemo(
    () => reports.filter((report) => report.report_type === 'post').length,
    [reports]
  )
  const pendingReportsCount = useMemo(
    () => reports.filter((report) => report.status === 'pending').length,
    [reports]
  )

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

  const findOrCreateConversation = useCallback(async (otherUserId: string, postId?: string | null) => {
    if (!user) return null

    try {
      const { data: existingConvs, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .is('deleted_at', null)

      if (searchError) {
        console.error('Error searching for conversation:', searchError)
      }

      const existingConv = existingConvs?.find((conv) => {
        const convData = conv as { is_group?: boolean; deleted_at?: string | null }
        return !convData.is_group && !convData.deleted_at
      })

      if (existingConv && (existingConv as { id: string }).id) {
        return existingConv
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newConv, error: insertError } = await (supabase.from('conversations') as any)
        .insert({
          user1_id: user.id,
          user2_id: otherUserId,
          post_id: postId || null,
          type: 'direct',
          is_group: false
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating conversation:', insertError)
        if (insertError.code === '23505') {
          const { data: retryConvs } = await supabase
            .from('conversations')
            .select('*')
            .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
            .is('deleted_at', null)
            .limit(1)

          if (retryConvs && retryConvs.length > 0) {
            return retryConvs[0]
          }
        }
        return null
      }

      return newConv
    } catch (error) {
      console.error('Error in findOrCreateConversation:', error)
      return null
    }
  }, [user])

  const handleOpenConversation = async (
    report: ModerationReport,
    targetUserId: string | null | undefined,
    postId?: string | null
  ) => {
    if (!targetUserId || !user) return
    setActionLoading(report.id)

    try {
      const conversation = await findOrCreateConversation(targetUserId, postId)
      if (conversation && (conversation as { id: string }).id) {
        navigate(`/messages/${(conversation as { id: string }).id}`)
      } else {
        alert('Erreur lors de la création de la conversation')
      }
    } catch (error) {
      console.error('Error opening conversation:', error)
      alert('Erreur lors de l\'ouverture de la conversation')
    } finally {
      setActionLoading(null)
    }
  }

  const findConversationBetweenUsers = useCallback(async (userA: string, userB: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${userA},user2_id.eq.${userB}),and(user1_id.eq.${userB},user2_id.eq.${userA})`)
        .is('deleted_at', null)

      if (error) {
        console.error('Error finding conversation between users:', error)
        return null
      }

      const existingConv = (data || []).find((conv) => {
        const convData = conv as { is_group?: boolean; deleted_at?: string | null }
        return !convData.is_group && !convData.deleted_at
      })

      return existingConv || null
    } catch (error) {
      console.error('Error in findConversationBetweenUsers:', error)
      return null
    }
  }, [])

  const handleOpenExistingConversation = async (report: ModerationReport, userA?: string | null, userB?: string | null) => {
    if (!userA || !userB) return
    setActionLoading(report.id)

    try {
      const conversation = await findConversationBetweenUsers(userA, userB)
      if (conversation && (conversation as { id: string }).id) {
        navigate(`/messages/${(conversation as { id: string }).id}`)
      } else {
        alert('Aucune conversation entre ces deux utilisateurs.')
      }
    } catch (error) {
      console.error('Error opening existing conversation:', error)
      alert('Erreur lors de l\'ouverture de la conversation')
    } finally {
      setActionLoading(null)
    }
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

      <div className="moderation-summary">
        <div className="moderation-summary-card">
          <span className="moderation-summary-label">Profils signales</span>
          <span className="moderation-summary-value">{profileReportsCount}</span>
        </div>
        <div className="moderation-summary-card">
          <span className="moderation-summary-label">Annonces signalees</span>
          <span className="moderation-summary-value">{postReportsCount}</span>
        </div>
        <div className="moderation-summary-card">
          <span className="moderation-summary-label">En attente</span>
          <span className="moderation-summary-value">{pendingReportsCount}</span>
        </div>
      </div>

      <div className="moderation-tabs">
        <button
          className={`moderation-tab-btn ${activeFilter === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveFilter('profile')}
        >
          Profils
        </button>
        <button
          className={`moderation-tab-btn ${activeFilter === 'post' ? 'active' : ''}`}
          onClick={() => setActiveFilter('post')}
        >
          Annonces
        </button>
        <button
          className={`moderation-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Tous
        </button>
      </div>

      <div className="moderation-filters">
        <button
          className={`moderation-filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          En attente
        </button>
        <button
          className={`moderation-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          Tout afficher
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
            customSubtext="Aucun signalement pour les filtres selectionnes."
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

                  <div className="moderation-links">
                    {report.reported_user && (
                      <button
                        className="moderation-link"
                        onClick={() => navigate(`/profile/public/${report.reported_user?.id}`)}
                      >
                        Voir profil signale
                      </button>
                    )}
                    {report.reporter && (
                      <button
                        className="moderation-link"
                        onClick={() => navigate(`/profile/public/${report.reporter?.id}`)}
                      >
                        Voir profil auteur
                      </button>
                    )}
                    {report.reported_post && (
                      <button
                        className="moderation-link"
                        onClick={() => navigate(`/post/${report.reported_post?.id}`)}
                      >
                        Voir annonce
                      </button>
                    )}
                    {report.reported_user && (
                      <button
                        className="moderation-link"
                        onClick={() =>
                          handleOpenConversation(
                            report,
                            report.reported_user?.id,
                            report.reported_post?.id ?? null
                          )
                        }
                        disabled={isLoadingAction}
                      >
                        Voir messages avec signale
                      </button>
                    )}
                    {report.reporter && (
                      <button
                        className="moderation-link"
                        onClick={() => handleOpenConversation(report, report.reporter?.id)}
                        disabled={isLoadingAction}
                      >
                        Voir messages avec auteur
                      </button>
                    )}
                    {report.reporter && report.reported_user && (
                      <button
                        className="moderation-link"
                        onClick={() =>
                          handleOpenExistingConversation(
                            report,
                            report.reporter?.id,
                            report.reported_user?.id
                          )
                        }
                        disabled={isLoadingAction}
                      >
                        Voir conversation entre eux
                      </button>
                    )}
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
