import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserX } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import { useConfirmation } from '../../hooks/useConfirmation'
import ConfirmationModal from '../../components/ConfirmationModal'
import './BlockedProfiles.css'

interface BlockedProfileRow {
  blocked_id: string
  created_at?: string
  blocked?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

const BlockedProfiles = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const confirmation = useConfirmation()
  const [blockedProfiles, setBlockedProfiles] = useState<BlockedProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchBlockedProfiles()
    } else {
      setBlockedProfiles([])
      setLoading(false)
    }
  }, [user])

  const fetchBlockedProfiles = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id, created_at, blocked:blocked_id (id, username, full_name, avatar_url)')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching blocked profiles:', error)
        setBlockedProfiles([])
      } else {
        setBlockedProfiles((data as BlockedProfileRow[]) || [])
      }
    } catch (error) {
      console.error('Error fetching blocked profiles:', error)
      setBlockedProfiles([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Inconnu'
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return 'Inconnu'
    }
  }

  const handleUnblock = (blockedId: string, displayName: string) => {
    if (!user) return

    confirmation.confirm(
      {
        title: 'Débloquer le profil',
        message: `Voulez-vous débloquer ${displayName} ?`,
        confirmLabel: 'Débloquer',
        cancelLabel: 'Annuler'
      },
      async () => {
        setUnblockingId(blockedId)
        try {
          const { error } = await supabase
            .from('user_blocks')
            .delete()
            .eq('blocker_id', user.id)
            .eq('blocked_id', blockedId)

          if (error) {
            console.error('Error unblocking profile:', error)
            alert('Erreur lors du déblocage du profil')
            return
          }

          setBlockedProfiles((prev) => prev.filter((block) => block.blocked_id !== blockedId))
        } catch (error) {
          console.error('Error unblocking profile:', error)
          alert('Erreur lors du déblocage du profil')
        } finally {
          setUnblockingId(null)
        }
      }
    )
  }

  return (
    <div className="page">
      <div className="page-content blocked-profiles-page">
        <div className="blocked-profiles-container">
          {loading ? (
            <div className="loading-state">Chargement...</div>
          ) : blockedProfiles.length === 0 ? (
            <div className="blocked-profiles-empty">
              <UserX size={48} />
              <p>Aucun profil bloqué pour le moment.</p>
            </div>
          ) : (
            <div className="blocked-profiles-list">
              {blockedProfiles.map((block) => {
                const profile = block.blocked
                const displayName = profile?.full_name || profile?.username || 'Utilisateur'
                const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`

                return (
                  <div className="blocked-profile-item" key={block.blocked_id}>
                    <div className="blocked-profile-info">
                      <div className="blocked-profile-avatar">
                        <img
                          src={profile?.avatar_url || avatarFallback}
                          alt={displayName}
                          onError={(event) => {
                            ;(event.target as HTMLImageElement).src = avatarFallback
                          }}
                        />
                      </div>
                      <div className="blocked-profile-details">
                        <span className="blocked-profile-name">{displayName}</span>
                        {profile?.username && (
                          <span className="blocked-profile-username">@{profile.username}</span>
                        )}
                        <span className="blocked-profile-date">Bloqué le {formatDate(block.created_at)}</span>
                      </div>
                    </div>
                    <div className="blocked-profile-actions">
                      <button
                        className="blocked-profile-view"
                        type="button"
                        onClick={() => profile?.id && navigate(`/profile/public/${profile.id}`)}
                        disabled={!profile?.id}
                      >
                        Voir profil
                      </button>
                      <button
                        className="blocked-profile-unblock"
                        type="button"
                        onClick={() => handleUnblock(block.blocked_id, displayName)}
                        disabled={unblockingId === block.blocked_id}
                      >
                        {unblockingId === block.blocked_id ? 'Déblocage...' : 'Débloquer'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {confirmation.isOpen && confirmation.options && (
        <ConfirmationModal
          visible={confirmation.isOpen}
          title={confirmation.options.title}
          message={confirmation.options.message}
          onConfirm={confirmation.handleConfirm}
          onCancel={confirmation.handleCancel}
          confirmLabel={confirmation.options.confirmLabel}
          cancelLabel={confirmation.options.cancelLabel}
          isDestructive={confirmation.options.isDestructive}
        />
      )}
    </div>
  )
}

export default BlockedProfiles
