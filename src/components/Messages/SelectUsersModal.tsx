import { useEffect, useMemo, useState } from 'react'
import { X, Check } from 'lucide-react'
import './SelectUsersModal.css'

interface SelectableUser {
  id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  email?: string | null
}

interface SelectUsersModalProps {
  visible: boolean
  title: string
  users: SelectableUser[]
  loading?: boolean
  multiple?: boolean
  confirmLabel?: string
  emptyText?: string
  onClose: () => void
  onSelectUser?: (user: SelectableUser) => void
  onConfirm?: (users: SelectableUser[]) => void
}

const SelectUsersModal = ({
  visible,
  title,
  users,
  loading = false,
  multiple = false,
  confirmLabel = 'Continuer',
  emptyText = 'Aucun utilisateur disponible',
  onClose,
  onSelectUser,
  onConfirm
}: SelectUsersModalProps) => {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!visible) {
      setSearch('')
      setSelectedIds([])
    }
  }, [visible])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      const name = (user.full_name || user.username || '').toLowerCase()
      return name.includes(query)
    })
  }, [users, search])

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  if (!visible) return null

  return (
    <div className="select-users-modal-overlay" onClick={onClose}>
      <div className="select-users-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="select-users-modal-header">
          <h2>{title}</h2>
          <button className="select-users-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="select-users-modal-search">
          <input
            type="text"
            placeholder="Rechercher un utilisateur"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="select-users-modal-body">
          {loading ? (
            <div className="select-users-modal-empty">{'Chargement...'}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="select-users-modal-empty">{emptyText}</div>
          ) : (
            <div className="select-users-modal-list">
              {filteredUsers.map((user) => {
                const displayName = user.full_name || user.username || 'Utilisateur'
                const isSelected = selectedIds.includes(user.id)
                return (
                  <button
                    key={user.id}
                    className={`select-users-modal-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (multiple) {
                        toggleUser(user.id)
                      } else if (onSelectUser) {
                        onSelectUser(user)
                      }
                    }}
                  >
                    <div className="select-users-modal-avatar-wrapper">
                      <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`}
                        alt={displayName}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`
                        }}
                      />
                    </div>
                    <div className="select-users-modal-info">
                      <span>{displayName}</span>
                    </div>
                    {multiple && (
                      <div className={`select-users-modal-check ${isSelected ? 'active' : ''}`}>
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {multiple && (
          <div className="select-users-modal-footer">
            <button className="select-users-modal-cancel" onClick={onClose}>
              Annuler
            </button>
            <button
              className="select-users-modal-confirm"
              onClick={() => {
                if (onConfirm) {
                  const selectedUsers = users.filter((user) => selectedIds.includes(user.id))
                  onConfirm(selectedUsers)
                }
              }}
              disabled={selectedIds.length === 0}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SelectUsersModal
