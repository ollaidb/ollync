import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, X, ChevronUp, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useSupabase'
import CalendarPicker from './CalendarPicker'
import './MessageBubble.css'

type AppointmentDetails = {
  id: string
  status: string | null
  appointment_datetime: string | null
  sender_id: string
  recipient_id: string
  created_at?: string | null
  updated_at?: string | null
}

const appointmentByMessageCache = new Map<string, AppointmentDetails | null>()

function truncateCardLabel(value: string, max = 25) {
  const text = String(value || '').trim()
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

function formatDurationMinutes(minutes?: number | null) {
  const total = Math.max(0, Number(minutes || 0))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, '0')}`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m} min`
  return ''
}

function durationMinutesToTime(minutes: number) {
  const total = Math.max(30, Math.floor(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function durationTimeToMinutes(value: string) {
  const [hRaw, mRaw] = (value || '01:00').trim().split(':')
  const h = parseInt(hRaw || '0', 10)
  const m = parseInt(mRaw || '0', 10)
  return Math.max(30, h * 60 + m)
}

function formatTimeEdit(value: string) {
  const [hRaw, mRaw] = (value || '00:00').trim().split(':')
  const h = Math.min(Math.max(parseInt(hRaw || '0', 10), 0), 23)
  const m = Math.min(Math.max(parseInt(mRaw || '0', 10), 0), 59)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function normalizeTimeEdit(value: string) {
  const v = value.replace(/\s/g, '')
  if (!v) return '00:00'
  const parts = v.split(':')
  if (parts.length === 1) {
    const raw = parts[0]
    if (raw.length <= 2) return raw
    return `${raw.slice(0, 2)}:${raw.slice(2, 4)}`
  }
  const [h, m] = parts
  return `${(h || '00').slice(0, 2)}:${(m || '00').slice(0, 2)}`
}

export interface AppointmentBlockProps {
  message: {
    id: string
    sender_id: string
    conversation_id?: string | null
    calendar_request_data?: Record<string, unknown> | null
  }
  isOwn: boolean
  isGroupConversation?: boolean
  currentUserGroupRole?: string | null
}

export function AppointmentBlock({
  message,
  isOwn,
  isGroupConversation = false,
  currentUserGroupRole = null
}: AppointmentBlockProps) {
  const { user } = useAuth()
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newDate, setNewDate] = useState<string | null>(null)
  const [newTime, setNewTime] = useState('')
  const [newDuration, setNewDuration] = useState('01:00')
  const [updating, setUpdating] = useState(false)

  const calendarData = message.calendar_request_data as {
    title?: string
    event_name?: string
    appointment_datetime?: string
    start_date?: string
    duration_minutes?: number
    status?: string
    previous_appointment_datetime?: string
    previous_duration_minutes?: number
  } | null

  const isCancelled = appointmentDetails?.status === 'cancelled' || calendarData?.status === 'cancelled'
  const appointmentDateTime = appointmentDetails?.appointment_datetime ?? calendarData?.appointment_datetime ?? calendarData?.start_date
  const title = calendarData?.title || calendarData?.event_name || 'Rendez-vous'
  const durationLabel = formatDurationMinutes(calendarData?.duration_minutes)
  const isModified = !!appointmentDetails?.updated_at && !!appointmentDetails?.created_at &&
    (new Date(appointmentDetails.updated_at).getTime() - new Date(appointmentDetails.created_at).getTime() > 2000)
  // Droits : 1-to-1 les deux, groupe = créateur ou modérateur. Aucune restriction par date :
  // on peut annuler et modifier un rendez-vous quelle que soit sa date (passé, aujourd'hui, futur).
  const canModify = !isGroupConversation || message.sender_id === user?.id || currentUserGroupRole === 'moderator'

  const cardSubtitle = appointmentDateTime
    ? truncateCardLabel(
        [
          new Date(appointmentDateTime).toLocaleDateString('fr-FR'),
          new Date(appointmentDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          durationLabel
        ]
          .filter(Boolean)
          .join(' • '),
        25
      )
    : truncateCardLabel(title, 25)

  useEffect(() => {
    if (!message.id) return
    const cached = appointmentByMessageCache.get(message.id)
    if (cached !== undefined) {
      setAppointmentDetails(cached)
      return
    }
    const fetchAppointment = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('id, status, appointment_datetime, sender_id, recipient_id, created_at, updated_at')
          .eq('message_id', message.id)
          .maybeSingle()
        if (error) throw error
        if (data) {
          const row = data as {
            id: string
            status: string | null
            appointment_datetime: string | null
            sender_id: string
            recipient_id: string
            created_at?: string | null
            updated_at?: string | null
          }
          const next: AppointmentDetails = {
            id: row.id,
            status: row.status ?? null,
            appointment_datetime: row.appointment_datetime ?? null,
            sender_id: row.sender_id,
            recipient_id: row.recipient_id,
            created_at: row.created_at ?? null,
            updated_at: row.updated_at ?? null
          }
          appointmentByMessageCache.set(message.id, next)
          setAppointmentDetails(next)
        } else {
          appointmentByMessageCache.set(message.id, null)
          setAppointmentDetails(null)
        }
      } catch (err) {
        console.error('Error fetching appointment:', err)
      }
    }
    fetchAppointment()
  }, [message.id])

  const stepTime = (deltaMinutes: number) => {
    const base = newTime.trim() || '00:00'
    const [hRaw, mRaw] = formatTimeEdit(base).split(':')
    const h = parseInt(hRaw, 10)
    const m = parseInt(mRaw, 10)
    const total = h * 60 + m + deltaMinutes
    const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60)
    setNewTime(`${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`)
  }

  const stepDuration = (deltaMinutes: number) => {
    setNewDuration(durationMinutesToTime(Math.max(30, durationTimeToMinutes(newDuration) + deltaMinutes)))
  }

  const closeModal = () => {
    setShowModal(false)
    setShowCancelConfirm(false)
    setEditing(false)
    setNewDate(null)
    setNewTime('')
    setNewDuration('01:00')
  }

  const handleUpdate = async () => {
    if (!newDate || !newTime || !newDuration || !appointmentDetails?.id || !user || updating) return
    setUpdating(true)
    try {
      const [hours, minutes] = newTime.split(':')
      const dt = new Date(newDate)
      dt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
      const iso = dt.toISOString()
      const durationMinutes = durationTimeToMinutes(newDuration)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: errApp } = await (supabase as any).from('appointments').update({ appointment_datetime: iso, updated_at: new Date().toISOString() }).eq('id', appointmentDetails.id)
      if (errApp) throw errApp

      const nextCalendarData = {
        ...(calendarData || {}),
        appointment_datetime: iso,
        duration_minutes: durationMinutes,
        previous_appointment_datetime: appointmentDateTime || undefined,
        previous_duration_minutes: calendarData?.duration_minutes ?? undefined
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: errMsg } = await (supabase as any).from('messages').update({ calendar_request_data: nextCalendarData }).eq('id', message.id)
      if (errMsg) throw errMsg

      const newDateLabel = new Date(iso).toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      if (appointmentDetails.sender_id && appointmentDetails.recipient_id) {
        const otherId = appointmentDetails.sender_id === user.id ? appointmentDetails.recipient_id : appointmentDetails.sender_id
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('notifications').insert({
            user_id: otherId,
            type: 'appointment',
            title: 'Rendez-vous modifié',
            content: `Le rendez-vous "${title}" a été déplacé au ${newDateLabel}`,
            related_id: appointmentDetails.id,
            metadata: { conversation_id: message.conversation_id, appointment_id: appointmentDetails.id, appointment_datetime: iso }
          })
        } catch {
          /* ignore */
        }
      }

      const newUpdatedAt = new Date().toISOString()
      appointmentByMessageCache.set(message.id, { ...appointmentDetails, appointment_datetime: iso, updated_at: newUpdatedAt })
      setAppointmentDetails((prev) => (prev ? { ...prev, appointment_datetime: iso, updated_at: newUpdatedAt } : null))
      closeModal()
      window.location.reload()
    } catch (err) {
      console.error('Error updating appointment:', err)
      alert(`Erreur lors de la modification : ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (!appointmentDetails?.id || !user || updating) return
    setUpdating(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('appointments').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', appointmentDetails.id)
      if (error) throw error
      appointmentByMessageCache.set(message.id, { ...appointmentDetails, status: 'cancelled' })
      setAppointmentDetails((prev) => (prev ? { ...prev, status: 'cancelled' } : null))
      closeModal()
      window.location.reload()
    } catch (err) {
      console.error('Error cancelling appointment:', err)
      alert("Erreur lors de l'annulation du rendez-vous")
    } finally {
      setUpdating(false)
    }
  }

  const canUsePortal = typeof document !== 'undefined'

  const overlay =
    showCancelConfirm ? (
      <div
        className="appointment-overlay appointment-cancel-confirm-overlay"
        onClick={(e) => {
          if (updating) return
          if (e.target !== e.currentTarget) return
          setShowCancelConfirm(false)
        }}
      >
        <div className="appointment-cancel-confirm-panel" onClick={(e) => e.stopPropagation()}>
          <h3 className="appointment-cancel-confirm-title">Annuler le rendez-vous</h3>
          <p className="appointment-cancel-confirm-message">Voulez-vous vraiment annuler ce rendez-vous ?</p>
          <div className="appointment-cancel-confirm-actions">
            <button
              type="button"
              className="appointment-cancel-confirm-btn appointment-cancel-confirm-cancel"
              onClick={() => !updating && setShowCancelConfirm(false)}
              disabled={updating}
            >
              Garder
            </button>
            <button
              type="button"
              className="appointment-cancel-confirm-btn appointment-cancel-confirm-confirm"
              onClick={handleCancel}
              disabled={updating}
            >
              {updating ? 'Annulation...' : 'Annuler'}
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div
        className="appointment-overlay"
        onClick={(e) => {
          if (e.target !== e.currentTarget) return
          closeModal()
        }}
      >
        <div className="appointment-inline-panel" onClick={(e) => e.stopPropagation()}>
          <div className="appointment-inline-header">
            <h4>
              {title}
              {isCancelled && <span className="appointment-inline-title-cancelled"> • Rendez-vous annulé</span>}
            </h4>
            <button type="button" className="appointment-inline-close" onClick={closeModal} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
          <div className="appointment-inline-body">
            {appointmentDateTime && (
              <>
                {!editing ? (
                  <>
                    {calendarData?.previous_appointment_datetime && (
                      <div className="appointment-inline-old-date">
                        <span className="appointment-inline-old-date-label">Ancienne date</span>
                        <span className="appointment-inline-old-date-value">
                          {(() => {
                            const d = new Date(calendarData.previous_appointment_datetime)
                            const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                            const h = d.getHours()
                            const m = d.getMinutes()
                            const timeStr = m === 0 ? `à ${h}h` : `à ${h}h${String(m).padStart(2, '0')}`
                            const dur = calendarData.previous_duration_minutes != null ? formatDurationMinutes(calendarData.previous_duration_minutes) : ''
                            const durationStr = dur ? ` pour ${dur}` : ''
                            return `${dateStr} ${timeStr}${durationStr}`
                          })()}
                        </span>
                      </div>
                    )}
                    <div className="appointment-inline-info-block">
                      <span className="appointment-inline-info-datetime">
                        {(() => {
                          const d = new Date(appointmentDateTime)
                          const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                          const h = d.getHours()
                          const m = d.getMinutes()
                          const timeStr = m === 0 ? `à ${h}h` : `à ${h}h${String(m).padStart(2, '0')}`
                          const durationStr = durationLabel ? ` pour ${durationLabel}` : ''
                          return `${dateStr} ${timeStr}${durationStr}`
                        })()}
                      </span>
                    </div>
                    {!isCancelled && canModify && (
                      <div className="appointment-inline-actions appointment-inline-actions--row">
                        <button
                          type="button"
                          className="appointment-inline-cancel-btn"
                          onClick={() => setShowCancelConfirm(true)}
                          disabled={updating}
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          className="appointment-inline-edit-btn"
                          onClick={() => {
                            setEditing(true)
                            setNewDate(new Date(appointmentDateTime).toISOString().split('T')[0])
                            setNewTime(new Date(appointmentDateTime).toTimeString().slice(0, 5))
                            setNewDuration(durationMinutesToTime(calendarData?.duration_minutes ?? 60))
                          }}
                        >
                          Modifier
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="appointment-inline-form-group">
                      <label htmlFor="appointment-date">Date *</label>
                      <CalendarPicker
                        selectedDate={newDate}
                        onDateSelect={setNewDate}
                        minDate="2000-01-01"
                      />
                    </div>
                    <div className="appointment-inline-form-group">
                      <label htmlFor="appointment-time">Heure *</label>
                      <div className="appointment-inline-time-row">
                        <input
                          id="appointment-time"
                          type="text"
                          value={newTime}
                          onChange={(e) => setNewTime(normalizeTimeEdit(e.target.value))}
                          onBlur={() => setNewTime(formatTimeEdit(newTime))}
                          placeholder="HH:MM"
                          inputMode="numeric"
                          aria-label="Heure du rendez-vous"
                          className="appointment-inline-input appointment-inline-time-input"
                        />
                        <div className="appointment-inline-time-stepper">
                          <button type="button" className="appointment-inline-time-stepper-btn" onClick={() => stepTime(30)} aria-label="Augmenter de 30 minutes">
                            <ChevronUp size={14} />
                          </button>
                          <button type="button" className="appointment-inline-time-stepper-btn" onClick={() => stepTime(-30)} aria-label="Diminuer de 30 minutes">
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="appointment-inline-form-group">
                      <label htmlFor="appointment-duration">Durée *</label>
                      <div className="appointment-inline-time-row">
                        <input
                          id="appointment-duration"
                          type="text"
                          value={newDuration}
                          onChange={(e) => setNewDuration(normalizeTimeEdit(e.target.value))}
                          onBlur={() => setNewDuration(durationMinutesToTime(durationTimeToMinutes(newDuration)))}
                          placeholder="HH:MM"
                          inputMode="numeric"
                          aria-label="Durée du rendez-vous"
                          className="appointment-inline-input appointment-inline-time-input"
                        />
                        <div className="appointment-inline-time-stepper">
                          <button type="button" className="appointment-inline-time-stepper-btn" onClick={() => stepDuration(30)} aria-label="Augmenter de 30 minutes">
                            <ChevronUp size={14} />
                          </button>
                          <button type="button" className="appointment-inline-time-stepper-btn" onClick={() => stepDuration(-30)} aria-label="Diminuer de 30 minutes">
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="appointment-inline-actions appointment-inline-actions--row">
                      <button
                        type="button"
                        className="appointment-inline-back-btn"
                        onClick={() => {
                          setEditing(false)
                          setNewDate(null)
                          setNewTime('')
                          setNewDuration('01:00')
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="appointment-inline-save-btn"
                        onClick={handleUpdate}
                        disabled={updating || !newDate || !newTime || !newDuration}
                      >
                        {updating ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )

  return (
    <>
      <div
        className={`message-calendar ${isOwn ? 'own' : 'other'} ${isCancelled ? 'message-calendar--cancelled' : ''}`}
        onClick={() => setShowModal(true)}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowModal(true)}
      >
        <Calendar size={24} />
        <div className="message-calendar-info">
          <span className="message-calendar-title">
            Rendez-vous
            {isCancelled && <span className="message-calendar-title-cancelled"> • Rendez-vous annulé</span>}
            {!isCancelled && isModified && <span className="message-calendar-title-modified"> • Mise à jour</span>}
          </span>
          <span className="message-calendar-subtitle">
            {cardSubtitle || (appointmentDateTime ? new Date(appointmentDateTime).toLocaleDateString('fr-FR') : 'Rendez-vous')}
          </span>
        </div>
      </div>
      {showModal && canUsePortal && createPortal(overlay, document.body)}
    </>
  )
}
