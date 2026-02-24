import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BarChart3, CheckCircle2, FileDown, Flag, LayoutDashboard, ShieldAlert, BookOpen, Trash2, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useSupabase'
import BackButton from '../components/BackButton'
import ConfirmationModal from '../components/ConfirmationModal'
import { EmptyState } from '../components/EmptyState'
import './Moderation.css'

const MODERATOR_EMAIL = 'binta22116@gmail.com'

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'
type ReportType = 'profile' | 'post'
type MainTab = 'dashboard' | 'reports' | 'stats' | 'suspicious' | 'rules'

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

interface ModerationStats {
  total_users?: number
  total_posts?: number
  posts_last_7_days?: number
  posts_last_30_days?: number
  pending_reports?: number
  profile_reports_count?: number
  post_reports_count?: number
  flagged_posts_count?: number
  suspicious_activity_count?: number
  error?: string
}

interface SuspiciousActivityRow {
  id: string
  user_id: string
  activity_type: string
  source_table: string | null
  source_id: string | null
  score: number
  details: Record<string, unknown> | null
  created_at: string
  profiles?: { full_name: string | null; username: string | null; email: string | null } | null
}

type FilterType = 'all' | 'profile' | 'post'
type StatusFilter = 'all' | 'pending'

const Moderation = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [mainTab, setMainTab] = useState<MainTab>('dashboard')
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [suspiciousList, setSuspiciousList] = useState<SuspiciousActivityRow[]>([])
  const [suspiciousLoading, setSuspiciousLoading] = useState(false)
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

  const fetchStats = useCallback(async () => {
    if (!user || !isModerator) return
    setStatsLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_moderation_stats')
      if (error) {
        setStats({ error: error.message })
      } else if (data && typeof data === 'object' && !('error' in data)) {
        setStats(data as ModerationStats)
      } else {
        setStats((data as ModerationStats)?.error ? { error: (data as ModerationStats).error } : null)
      }
    } catch (e) {
      setStats({ error: String(e) })
    }
    setStatsLoading(false)
  }, [user, isModerator])

  const fetchSuspicious = useCallback(async () => {
    if (!user || !isModerator) return
    setSuspiciousLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('suspicious_activity') as any)
        .select('id, user_id, activity_type, source_table, source_id, score, details, created_at, profiles!user_id(full_name, username, email)')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) {
        console.error('Error fetching suspicious activity:', error)
        setSuspiciousList([])
      } else {
        setSuspiciousList((data as SuspiciousActivityRow[]) || [])
      }
    } catch {
      setSuspiciousList([])
    }
    setSuspiciousLoading(false)
  }, [user, isModerator])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    if (mainTab === 'dashboard' || mainTab === 'stats') fetchStats()
  }, [mainTab, fetchStats])

  useEffect(() => {
    if (mainTab === 'suspicious') fetchSuspicious()
  }, [mainTab, fetchSuspicious])

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

  const exportReportsCsv = () => {
    const headers = ['Date', 'Type', 'Raison', 'Statut', 'Auteur signalement', 'Profil/Annonce signalé(e)', 'Description']
    const rows = filteredReports.map((r) => {
      const reporter = r.reporter?.full_name || r.reporter?.username || r.reporter?.email || ''
      const reported = r.report_type === 'profile'
        ? (r.reported_user?.full_name || r.reported_user?.username || r.reported_user?.email || '')
        : (r.reported_post?.title || '')
      return [
        new Date(r.created_at).toLocaleString('fr-FR'),
        r.report_type,
        r.report_reason,
        r.status,
        reporter,
        reported,
        (r.description || '').replace(/"/g, '""')
      ]
    })
    const csv = [headers.join(';'), ...rows.map((row) => row.map((c) => `"${c}"`).join(';'))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `signalements_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
          <h2>Accès réservé</h2>
          <p>Connectez-vous avec le compte autorisé.</p>
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
          <h2>Accès refusé</h2>
          <p>Cette page est disponible uniquement pour le compte modérateur.</p>
        </div>
      </div>
    )
  }

  const renderReportsList = () => (
    <>
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
        <button
          type="button"
          className="moderation-filter-btn moderation-export-btn"
          onClick={exportReportsCsv}
          disabled={filteredReports.length === 0}
        >
          <FileDown size={16} />
          Exporter CSV
        </button>
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
      {reportsLoading ? (
        <div className="moderation-loading">Chargement des signalements...</div>
      ) : filteredReports.length === 0 ? (
        <div className="moderation-empty">
          <EmptyState
            type="category"
            customIcon={Flag}
            customTitle="Aucun signalement"
            customSubtext="Aucun signalement pour les filtres sélectionnés."
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
                    {report.report_category && <span>Catégorie: {report.report_category}</span>}
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
                        {isProfileReport ? 'Profil signalé' : 'Annonce signalée'}
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
                        Voir profil signalé
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
                        Voir messages avec signalé
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
                    Marquer examiné
                  </button>
                  <button
                    className="moderation-action"
                    onClick={() => updateReportStatus(report, 'resolved')}
                    disabled={isLoadingAction}
                  >
                    <CheckCircle2 size={16} />
                    Résolu
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
    </>
  )

  return (
    <div className="moderation-page">
      <div className="moderation-header">
        <BackButton />
        <h1>Modération</h1>
        <div className="moderation-header-spacer" />
      </div>

      <nav className="moderation-main-nav">
        <button
          type="button"
          className={`moderation-main-nav-btn ${mainTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setMainTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          Tableau de bord
        </button>
        <button
          type="button"
          className={`moderation-main-nav-btn ${mainTab === 'reports' ? 'active' : ''}`}
          onClick={() => setMainTab('reports')}
        >
          <Flag size={18} />
          Signalements
        </button>
        <button
          type="button"
          className={`moderation-main-nav-btn ${mainTab === 'stats' ? 'active' : ''}`}
          onClick={() => setMainTab('stats')}
        >
          <BarChart3 size={18} />
          Statistiques
        </button>
        <button
          type="button"
          className={`moderation-main-nav-btn ${mainTab === 'suspicious' ? 'active' : ''}`}
          onClick={() => setMainTab('suspicious')}
        >
          <AlertTriangle size={18} />
          Activité suspecte
        </button>
        <button
          type="button"
          className={`moderation-main-nav-btn ${mainTab === 'rules' ? 'active' : ''}`}
          onClick={() => setMainTab('rules')}
        >
          <BookOpen size={18} />
          Règles
        </button>
      </nav>

      <div className="moderation-content">
        {mainTab === 'dashboard' && (
          <>
            <div className="moderation-overview">
              <div className="moderation-overview-users">
                <span className="moderation-overview-users-label">Utilisateurs dans l&apos;application</span>
                {statsLoading ? (
                  <span className="moderation-overview-users-value">...</span>
                ) : stats?.error ? (
                  <span className="moderation-overview-users-value">—</span>
                ) : (
                  <span className="moderation-overview-users-value">{stats?.total_users ?? '—'}</span>
                )}
              </div>
            </div>
            <div className="moderation-summary">
              <div className="moderation-summary-card">
                <span className="moderation-summary-label">Profils signalés</span>
                <span className="moderation-summary-value">{profileReportsCount}</span>
              </div>
              <div className="moderation-summary-card">
                <span className="moderation-summary-label">Annonces signalées</span>
                <span className="moderation-summary-value">{postReportsCount}</span>
              </div>
              <div className="moderation-summary-card">
                <span className="moderation-summary-label">En attente</span>
                <span className="moderation-summary-value">{pendingReportsCount}</span>
              </div>
            </div>
            <div className="moderation-rules-block">
              <h3 className="moderation-rules-block-title">Comment ça se passe</h3>
              <ul className="moderation-rules-list">
                <li>Un utilisateur signale un <strong>profil</strong> ou une <strong>annonce</strong> depuis l&apos;application.</li>
                <li>Vous recevez le signalement dans l&apos;onglet <strong>Signalements</strong> avec la raison et la description.</li>
                <li>Vous avez accès au profil signalé, au profil de l&apos;auteur du signalement, à l&apos;annonce et aux conversations.</li>
                <li>Si vous déterminez que le compte ou l&apos;annonce est suspect : vous pouvez <strong>supprimer définitivement</strong> le profil ou l&apos;annonce (avec confirmation).</li>
                <li>Sinon : marquez le signalement comme <strong>Examiné</strong>, <strong>Résolu</strong> ou <strong>Ignorer</strong>.</li>
              </ul>
              <p className="moderation-rules-note">Cette page est réservée au compte modérateur. Un seul profil a accès.</p>
            </div>
          </>
        )}

        {mainTab === 'reports' && renderReportsList()}

        {mainTab === 'stats' && (
          <div className="moderation-stats-section">
            {statsLoading ? (
              <div className="moderation-loading">Chargement des statistiques...</div>
            ) : stats?.error ? (
              <div className="moderation-empty">
                <p>Impossible de charger les statistiques : {stats.error}</p>
              </div>
            ) : (
              <div className="moderation-stats-grid">
                <div className="moderation-stats-card">
                  <span className="moderation-stats-label">Utilisateurs</span>
                  <span className="moderation-stats-value">{stats?.total_users ?? '—'}</span>
                </div>
                <div className="moderation-stats-card">
                  <span className="moderation-stats-label">Annonces publiées</span>
                  <span className="moderation-stats-value">{stats?.total_posts ?? '—'}</span>
                </div>
                <div className="moderation-stats-card">
                  <span className="moderation-stats-label">Annonces (7 derniers jours)</span>
                  <span className="moderation-stats-value">{stats?.posts_last_7_days ?? '—'}</span>
                </div>
                <div className="moderation-stats-card">
                  <span className="moderation-stats-label">Annonces (30 derniers jours)</span>
                  <span className="moderation-stats-value">{stats?.posts_last_30_days ?? '—'}</span>
                </div>
                <div className="moderation-stats-card">
                  <span className="moderation-stats-label">Annonces par utilisateur (moy.)</span>
                  <span className="moderation-stats-value">
                    {stats?.total_users != null && stats?.total_users > 0 && stats?.total_posts != null
                      ? (stats.total_posts / stats.total_users).toFixed(1)
                      : '—'}
                  </span>
                </div>
                <div className="moderation-stats-card">
                  <span className="moderation-stats-label">Contenus flagués (auto)</span>
                  <span className="moderation-stats-value">{stats?.flagged_posts_count ?? '—'}</span>
                </div>
                <div className="moderation-stats-card">
                  <span className="moderation-stats-label">Activité suspecte (total)</span>
                  <span className="moderation-stats-value">{stats?.suspicious_activity_count ?? '—'}</span>
                </div>
                <div className="moderation-stats-card">
                  <span className="moderation-stats-label">Signalements en attente</span>
                  <span className="moderation-stats-value">{stats?.pending_reports ?? '—'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {mainTab === 'suspicious' && (
          <div className="moderation-suspicious-section">
            {suspiciousLoading ? (
              <div className="moderation-loading">Chargement de l&apos;activité suspecte...</div>
            ) : suspiciousList.length === 0 ? (
              <div className="moderation-empty">
                <EmptyState
                  type="category"
                  customIcon={AlertTriangle}
                  customTitle="Aucune activité suspecte"
                  customSubtext="Aucune entrée enregistrée (contenus flagués par la modération automatique)."
                />
              </div>
            ) : (
              <div className="moderation-list">
                {suspiciousList.map((row) => {
                  const profile = row.profiles
                  const userName = profile?.full_name || profile?.username || profile?.email || row.user_id.slice(0, 8)
                  return (
                    <div key={row.id} className="moderation-card moderation-card-suspicious">
                      <div className="moderation-card-header">
                        <div className="moderation-card-title">
                          <AlertTriangle size={18} />
                          <span>{row.activity_type}</span>
                        </div>
                        <span className="moderation-stats-value moderation-score">Score {row.score}</span>
                      </div>
                      <div className="moderation-meta">
                        <span>Utilisateur : {userName}</span>
                        <span>Source : {row.source_table || '—'} {row.source_id ? `(${row.source_id.slice(0, 8)}…)` : ''}</span>
                        <span>
                          {new Date(row.created_at).toLocaleDateString('fr-FR')} ·{' '}
                          {new Date(row.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {row.details?.reasons && (
                        <p className="moderation-description">
                          Raisons : {Array.isArray(row.details.reasons) ? (row.details.reasons as string[]).join(', ') : String(row.details.reasons)}
                        </p>
                      )}
                      <button
                        type="button"
                        className="moderation-link"
                        onClick={() => navigate(`/profile/public/${row.user_id}`)}
                      >
                        Voir profil
                      </button>
                      {row.source_table === 'posts' && row.source_id && (
                        <button
                          type="button"
                          className="moderation-link"
                          onClick={() => navigate(`/post/${row.source_id}`)}
                        >
                          Voir annonce
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {mainTab === 'rules' && (
          <div className="moderation-rules-page">
            <h2>Règles et procédures de modération</h2>
            <section>
              <h3>1. Signalement reçu</h3>
              <p>Un utilisateur signale un profil ou une annonce depuis l&apos;application (bouton « Signaler »). Le signalement est enregistré avec une raison (suspect, fraudeur, contenu inapproprié, spam, etc.) et une description optionnelle.</p>
            </section>
            <section>
              <h3>2. Accès modérateur</h3>
              <p>Vous voyez la liste des signalements dans l&apos;onglet <strong>Signalements</strong>. Chaque carte affiche : le type (profil ou annonce), la raison, la catégorie, la date, l&apos;auteur du signalement et le profil ou l&apos;annonce signalé(e).</p>
            </section>
            <section>
              <h3>3. Vérification</h3>
              <p>Vous pouvez : <strong>Voir profil signalé</strong>, <strong>Voir profil auteur</strong>, <strong>Voir annonce</strong>, <strong>Voir messages avec signalé</strong>, <strong>Voir messages avec auteur</strong>, <strong>Voir conversation entre eux</strong>. Utilisez ces liens pour juger du bien-fondé du signalement.</p>
            </section>
            <section>
              <h3>4. Décision</h3>
              <ul>
                <li><strong>Si suspect :</strong> utilisez <strong>Supprimer profil</strong> ou <strong>Supprimer annonce</strong>. La suppression est définitive (avec confirmation).</li>
                <li><strong>Sinon :</strong> <strong>Marquer examiné</strong>, <strong>Résolu</strong> ou <strong>Ignorer</strong> pour clôturer le signalement.</li>
              </ul>
            </section>
            <section>
              <h3>5. Accès à la page</h3>
              <p>Un seul compte (modérateur) a accès à cette page. Les autres utilisateurs voient « Accès refusé ».</p>
            </section>
          </div>
        )}
      </div>

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
