import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ChevronLeft,
  Plus,
  Trash2,
  Pencil,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { agendaService } from '@/services/agenda'
import { eventsService } from '@/services/events'
import { organizationsService } from '@/services/organizations'
import { speakersService, type Speaker } from '@/services/speakers'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  _id: string
  title: string
  titleEn?: string
  startDateTime: string
  endDateTime: string
  room?: string
  roomEn?: string
  typeSession?: string
  typeSessionEn?: string
  requiresAttendance?: boolean
  speakers?: any[]
  speakerIds?: string[]
}

interface AgendaDoc {
  _id: string
  eventId: string
  organizationId?: string
  sessions: Session[]
  isPublished: boolean
  publishedAt?: string
  createdAt?: string
  dressCode?: string
  dressCodeEn?: string
  room?: string
  roomEn?: string
}

const EMPTY_SESSION = {
  title: '',
  titleEn: '',
  startDateTime: '',
  endDateTime: '',
  room: '',
  roomEn: '',
  typeSession: '',
  typeSessionEn: '',
  requiresAttendance: false,
  speakerIds: [] as string[],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { dateStyle: 'medium' }) + ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function toDateTimeLocalValue(value: string) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + 'T' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join(':')
}

// ─── Session Form ─────────────────────────────────────────────────────────────

function SessionForm({
  initial,
  onSave,
  onCancel,
  isPending,
  availableSpeakers = [],
}: {
  initial: typeof EMPTY_SESSION
  onSave: (data: typeof EMPTY_SESSION) => void
  onCancel: () => void
  isPending: boolean
  availableSpeakers?: Speaker[]
}) {
  const [form, setForm] = useState({ ...initial, speakerIds: initial.speakerIds ?? [] })

  return (
    <div
      style={{
        background: 'var(--bg-secondary, #f8fafc)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label className="field-label">Título *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Título de la sesión"
            autoFocus
          />
        </div>
        <div>
          <label className="field-label">Título (Inglés)</label>
          <input
            value={form.titleEn}
            onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
            placeholder="Session title"
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Inicio</label>
            <input
              type="datetime-local"
              value={form.startDateTime}
              onChange={(e) => setForm((f) => ({ ...f, startDateTime: e.target.value }))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-label">Fin</label>
            <input
              type="datetime-local"
              value={form.endDateTime}
              onChange={(e) => setForm((f) => ({ ...f, endDateTime: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Sala / Lugar</label>
            <input
              value={form.room}
              onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
              placeholder="Salón A, Auditorio..."
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-label">Sala / Lugar (Inglés)</label>
            <input
              value={form.roomEn}
              onChange={(e) => setForm((f) => ({ ...f, roomEn: e.target.value }))}
              placeholder="Room A, Auditorium..."
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Tipo</label>
            <input
              value={form.typeSession}
              onChange={(e) => setForm((f) => ({ ...f, typeSession: e.target.value }))}
              placeholder="Charla, Taller, Almuerzo..."
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-label">Tipo (Inglés)</label>
            <input
              value={form.typeSessionEn}
              onChange={(e) => setForm((f) => ({ ...f, typeSessionEn: e.target.value }))}
              placeholder="Talk, Workshop, Lunch..."
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            id="requiresAttendance"
            type="checkbox"
            checked={form.requiresAttendance}
            onChange={(e) => setForm((f) => ({ ...f, requiresAttendance: e.target.checked }))}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor="requiresAttendance" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
            Requiere registro de asistencia
          </label>
        </div>
        {availableSpeakers.length > 0 && (
          <div>
            <label className="field-label">Conferencistas</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {availableSpeakers.map((sp) => {
                const selected = form.speakerIds.includes(sp._id)
                return (
                  <button
                    key={sp._id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        speakerIds: selected
                          ? f.speakerIds.filter((id) => id !== sp._id)
                          : [...f.speakerIds, sp._id],
                      }))
                    }
                    style={{
                      fontSize: '0.8125rem',
                      padding: '4px 12px',
                      borderRadius: 20,
                      border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: selected ? 'var(--accent-soft, #eff6ff)' : 'transparent',
                      color: selected ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: selected ? 600 : 400,
                    }}
                  >
                    {sp.names}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            className="btn btn-primary"
            onClick={() => onSave(form)}
            disabled={!form.title || isPending}
          >
            {isPending ? 'Guardando...' : 'Guardar sesión'}
          </button>
          <button className="btn" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Agenda Card ──────────────────────────────────────────────────────────────

function AgendaCard({
  agenda,
  index,
  //orgId,
  onDelete,
  onPublish,
  onUnpublish,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  onUpdateAgenda,
  publishPending,
  deletePending,
  updatePending,
  availableSpeakers,
}: {
  agenda: AgendaDoc
  index: number
  orgId: string
  onDelete: () => void
  onPublish: () => void
  onUnpublish: () => void
  onAddSession: (session: typeof EMPTY_SESSION) => void
  onUpdateSession: (sessionId: string, session: typeof EMPTY_SESSION) => void
  onDeleteSession: (sessionId: string) => void
  onUpdateAgenda: (fields: Partial<AgendaDoc>) => void
  publishPending: boolean
  deletePending: boolean
  updatePending: boolean
  availableSpeakers: Speaker[]
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [deleteConfirmSessionId, setDeleteConfirmSessionId] = useState<string | null>(null)
  const [deleteConfirmAgenda, setDeleteConfirmAgenda] = useState(false)
  const [dressCodeDraft, setDressCodeDraft] = useState(agenda.dressCode ?? '')
  const [dressCodeEnDraft, setDressCodeEnDraft] = useState(agenda.dressCodeEn ?? '')
  const [roomDraft, setRoomDraft] = useState(agenda.room ?? '')
  const [roomEnDraft, setRoomEnDraft] = useState(agenda.roomEn ?? '')

  const handleEditSession = (session: Session) => {
    setEditingSessionId(session._id)
    setShowSessionForm(false)
  }

  return (
    <div
      className="card"
      style={{ marginBottom: 12, overflow: 'hidden' }}
    >
      {/* Agenda header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 20px',
          background: agenda.isPublished ? 'var(--accent-soft, #eff6ff)' : 'var(--bg-secondary, #f8fafc)',
          borderBottom: collapsed ? 'none' : '1px solid var(--border)',
        }}
      >
        <CalendarDays size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: '0.9375rem', flex: 1 }}>
          Agenda {index + 1}
        </span>
        {agenda.isPublished ? (
          <span style={{
            fontSize: '0.6875rem', fontWeight: 600,
            color: '#16a34a', background: '#dcfce7',
            padding: '2px 8px', borderRadius: 20,
            border: '1px solid #86efac',
          }}>
            PUBLICADA
          </span>
        ) : (
          <span style={{
            fontSize: '0.6875rem', fontWeight: 600,
            color: '#b45309', background: '#fef9c3',
            padding: '2px 8px', borderRadius: 20,
            border: '1px solid #fde047',
          }}>
            BORRADOR
          </span>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          {agenda.isPublished ? (
            <button
              className="btn"
              style={{ fontSize: '0.8125rem' }}
              onClick={onUnpublish}
              disabled={publishPending}
            >
              Despublicar
            </button>
          ) : (
            <button
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem' }}
              onClick={onPublish}
              disabled={publishPending}
            >
              Publicar
            </button>
          )}
          {deleteConfirmAgenda ? (
            <>
              <button
                className="btn"
                style={{ fontSize: '0.8125rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                onClick={onDelete}
                disabled={deletePending}
              >
                {deletePending ? 'Eliminando...' : 'Confirmar'}
              </button>
              <button
                className="btn"
                style={{ fontSize: '0.8125rem' }}
                onClick={() => setDeleteConfirmAgenda(false)}
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              className="btn"
              style={{ fontSize: '0.8125rem' }}
              onClick={() => setDeleteConfirmAgenda(true)}
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            className="btn"
            style={{ fontSize: '0.8125rem' }}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* DressCode / Room inline edit */}
      {!collapsed && (
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, padding: '8px 20px',
            background: 'var(--bg-secondary, #f8fafc)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ flex: 1 }}>
            <label className="field-label">Código de vestimenta</label>
            <input
              value={dressCodeDraft}
              onChange={(e) => setDressCodeDraft(e.target.value)}
              onBlur={() => onUpdateAgenda({ dressCode: dressCodeDraft })}
              placeholder="casual de negocios, formal..."
              style={{ marginTop: 2 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-label">Código de vestimenta (Inglés)</label>
            <input
              value={dressCodeEnDraft}
              onChange={(e) => setDressCodeEnDraft(e.target.value)}
              onBlur={() => onUpdateAgenda({ dressCodeEn: dressCodeEnDraft })}
              placeholder="business casual, formal..."
              style={{ marginTop: 2 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-label">Salón</label>
            <input
              value={roomDraft}
              onChange={(e) => setRoomDraft(e.target.value)}
              onBlur={() => onUpdateAgenda({ room: roomDraft })}
              placeholder="Auditorio, Salón A..."
              style={{ marginTop: 2 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-label">Salón (Inglés)</label>
            <input
              value={roomEnDraft}
              onChange={(e) => setRoomEnDraft(e.target.value)}
              onBlur={() => onUpdateAgenda({ roomEn: roomEnDraft })}
              placeholder="Auditorium, Room A..."
              style={{ marginTop: 2 }}
            />
          </div>
        </div>
      )}

      {/* Sessions */}
      {!collapsed && (
        <div style={{ padding: '12px 20px 20px' }}>
          {agenda.sessions.length === 0 && !showSessionForm ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '8px 0' }}>
              No hay sesiones. Añade la primera.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {agenda.sessions.map((session) => (
                <div key={session._id}>
                  {editingSessionId === session._id ? (
                    <SessionForm
                      initial={{
                        title: session.title,
                        titleEn: session.titleEn ?? '',
                        startDateTime: session.startDateTime
                          ? toDateTimeLocalValue(session.startDateTime)
                          : '',
                        endDateTime: session.endDateTime
                          ? toDateTimeLocalValue(session.endDateTime)
                          : '',
                        room: session.room ?? '',
                        roomEn: session.roomEn ?? '',
                        typeSession: session.typeSession ?? '',
                        typeSessionEn: session.typeSessionEn ?? '',
                        requiresAttendance: session.requiresAttendance ?? false,
                        speakerIds: session.speakers
                          ? session.speakers.map((s: any) => s._id ?? s)
                          : [],
                      }}
                      onSave={(data) => {
                        onUpdateSession(session._id, data)
                        setEditingSessionId(null)
                      }}
                      onCancel={() => setEditingSessionId(null)}
                      isPending={updatePending}
                      availableSpeakers={availableSpeakers}
                    />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '10px 14px',
                        background: 'var(--bg-secondary, #f8fafc)',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{session.title}</span>
                          {session.titleEn && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              / {session.titleEn}
                            </span>
                          )}
                          {session.typeSession && (
                            <span style={{
                              fontSize: '0.6875rem',
                              background: 'var(--accent-soft, #eff6ff)',
                              color: 'var(--accent)',
                              padding: '1px 7px',
                              borderRadius: 20,
                              border: '1px solid var(--accent)',
                            }}>
                              {session.typeSession}
                            </span>
                          )}
                          {session.typeSessionEn && (
                            <span style={{
                              fontSize: '0.6875rem',
                              background: 'var(--bg)',
                              color: 'var(--text-secondary)',
                              padding: '1px 7px',
                              borderRadius: 20,
                              border: '1px solid var(--border)',
                            }}>
                              {session.typeSessionEn}
                            </span>
                          )}
                          {session.requiresAttendance && (
                            <span style={{
                              fontSize: '0.6875rem',
                              background: '#fef9c3',
                              color: '#b45309',
                              padding: '1px 7px',
                              borderRadius: 20,
                              border: '1px solid #fde047',
                            }}>
                              Asistencia
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {session.startDateTime && formatDateTime(session.startDateTime)}
                          {session.endDateTime && ` → ${formatDateTime(session.endDateTime)}`}
                          {session.room && ` · ${session.room}`}
                          {session.roomEn && ` / ${session.roomEn}`}
                        </p>
                        {session.speakers && session.speakers.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {session.speakers.map((s: any) => (
                              <span key={s._id ?? s} style={{ fontSize: '0.75rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 8px' }}>
                                {s.names ?? s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          className="btn"
                          style={{ fontSize: '0.8125rem' }}
                          onClick={() => handleEditSession(session)}
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        {deleteConfirmSessionId === session._id ? (
                          <>
                            <button
                              className="btn"
                              style={{ fontSize: '0.8125rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                              onClick={() => {
                                onDeleteSession(session._id)
                                setDeleteConfirmSessionId(null)
                              }}
                            >
                              Confirmar
                            </button>
                            <button
                              className="btn"
                              style={{ fontSize: '0.8125rem' }}
                              onClick={() => setDeleteConfirmSessionId(null)}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn"
                            style={{ fontSize: '0.8125rem' }}
                            onClick={() => setDeleteConfirmSessionId(session._id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New session form */}
          {showSessionForm && (
            <SessionForm
              initial={EMPTY_SESSION}
              onSave={(data) => {
                onAddSession(data)
                setShowSessionForm(false)
              }}
              onCancel={() => setShowSessionForm(false)}
              isPending={updatePending}
              availableSpeakers={availableSpeakers}
            />
          )}

          {!showSessionForm && !editingSessionId && (
            <button
              className="btn"
              style={{ fontSize: '0.8125rem', marginTop: agenda.sessions.length > 0 ? 4 : 0 }}
              onClick={() => setShowSessionForm(true)}
            >
              <Plus size={13} /> Nueva sesión
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const { id: orgId, eventId } = useParams<{ id: string; eventId: string }>()
  const queryClient = useQueryClient()

  const { data: org } = useQuery({
    queryKey: ['organizations', orgId],
    queryFn: () => organizationsService.getById(orgId!),
    enabled: !!orgId,
  })

  const { data: event } = useQuery({
    queryKey: ['events', eventId],
    queryFn: () => eventsService.getById(eventId!),
    enabled: !!eventId,
  })

  const { data: agendas = [], isLoading } = useQuery<AgendaDoc[]>({
    queryKey: ['agendas', eventId],
    queryFn: () => agendaService.getByEvent(eventId!),
    enabled: !!eventId,
  })

  const { data: speakers = [] } = useQuery<Speaker[]>({
    queryKey: ['speakers', eventId],
    queryFn: () => speakersService.getByEvent(eventId!),
    enabled: !!eventId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['agendas', eventId] })

  const createAgendaMutation = useMutation({
    mutationFn: () =>
      agendaService.create({
        eventId,
        organizationId: org?._id ?? orgId,
        sessions: [],
        isPublished: false,
      }),
    onSuccess: invalidate,
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => agendaService.publish(id),
    onSuccess: invalidate,
  })

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => agendaService.unpublish(id),
    onSuccess: invalidate,
  })

  const deleteAgendaMutation = useMutation({
    mutationFn: (id: string) => agendaService.remove(id),
    onSuccess: invalidate,
  })

  const updateAgendaMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => agendaService.update(id, body),
    onSuccess: invalidate,
  })

  const handleAddSession = (agendaId: string, sessions: Session[], newSession: typeof EMPTY_SESSION) => {
    const updated = [
      ...sessions,
      {
        title: newSession.title,
        titleEn: newSession.titleEn || undefined,
        startDateTime: newSession.startDateTime || undefined,
        endDateTime: newSession.endDateTime || undefined,
        room: newSession.room || undefined,
        roomEn: newSession.roomEn || undefined,
        typeSession: newSession.typeSession || undefined,
        typeSessionEn: newSession.typeSessionEn || undefined,
        requiresAttendance: newSession.requiresAttendance,
        speakers: newSession.speakerIds,
      },
    ]
    updateAgendaMutation.mutate({ id: agendaId, body: { sessions: updated } })
  }

  const handleUpdateSession = (
    agendaId: string,
    sessions: Session[],
    sessionId: string,
    data: typeof EMPTY_SESSION,
  ) => {
    const updated = sessions.map((s) =>
      s._id === sessionId
        ? {
            ...s,
            title: data.title,
            titleEn: data.titleEn || undefined,
            startDateTime: data.startDateTime || s.startDateTime,
            endDateTime: data.endDateTime || s.endDateTime,
            room: data.room || undefined,
            roomEn: data.roomEn || undefined,
            typeSession: data.typeSession || undefined,
            typeSessionEn: data.typeSessionEn || undefined,
            requiresAttendance: data.requiresAttendance,
            speakers: data.speakerIds,
          }
        : s,
    )
    updateAgendaMutation.mutate({ id: agendaId, body: { sessions: updated } })
  }

  const handleDeleteSession = (agendaId: string, sessions: Session[], sessionId: string) => {
    const updated = sessions.filter((s) => s._id !== sessionId)
    updateAgendaMutation.mutate({ id: agendaId, body: { sessions: updated } })
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link
          to={`/organizations/${orgId}/events`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border)', color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          <ChevronLeft size={16} />
        </Link>
        <div>
          <h1 style={{ marginBottom: 1 }}>Agenda</h1>
          <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-secondary)' }}>
            {org?.name}{event ? ` · ${event.name}` : ''}
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            className="btn btn-primary"
            onClick={() => createAgendaMutation.mutate()}
            disabled={createAgendaMutation.isPending}
          >
            <Plus size={14} /> Nueva agenda
          </button>
        </div>
      </div>

      {/* Published status banners */}
      {agendas.length > 0 && (() => {
        const publishedCount = agendas.filter((a) => a.isPublished).length
        if (publishedCount === agendas.length) {
          return (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#dcfce7', border: '1px solid #86efac',
              borderRadius: 10, padding: '10px 16px', marginBottom: 16,
            }}>
              <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '0.875rem', color: '#166534', fontWeight: 500 }}>
                Toda la agenda está publicada — visible en la app
              </span>
            </div>
          )
        }
        if (publishedCount === 0) {
          return (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fef9c3', border: '1px solid #fde047',
              borderRadius: 10, padding: '10px 16px', marginBottom: 16,
            }}>
              <Clock size={16} style={{ color: '#b45309', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '0.875rem', color: '#92400e', fontWeight: 500 }}>
                Borrador — no visible en la app. Publica al menos una agenda para que sea visible.
              </span>
            </div>
          )
        }
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#fef9c3', border: '1px solid #fde047',
            borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          }}>
            <Clock size={16} style={{ color: '#b45309', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '0.875rem', color: '#92400e', fontWeight: 500 }}>
              {publishedCount} de {agendas.length} agendas publicadas
            </span>
          </div>
        )
      })()}

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: 120, background: '#f1f5f9', borderRadius: 14 }} />
          ))}
        </div>
      ) : agendas.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CalendarDays size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No hay agendas. Crea la primera.</p>
        </div>
      ) : (
        agendas.map((agenda, index) => (
          <AgendaCard
            key={agenda._id}
            agenda={agenda}
            index={index}
            orgId={orgId!}
            onDelete={() => deleteAgendaMutation.mutate(agenda._id)}
            onPublish={() => publishMutation.mutate(agenda._id)}
            onUnpublish={() => unpublishMutation.mutate(agenda._id)}
            onAddSession={(s) => handleAddSession(agenda._id, agenda.sessions, s)}
            onUpdateSession={(sid, s) => handleUpdateSession(agenda._id, agenda.sessions, sid, s)}
            onDeleteSession={(sid) => handleDeleteSession(agenda._id, agenda.sessions, sid)}
            onUpdateAgenda={(fields) => updateAgendaMutation.mutate({ id: agenda._id, body: fields })}
            publishPending={publishMutation.isPending || unpublishMutation.isPending}
            deletePending={deleteAgendaMutation.isPending}
            updatePending={updateAgendaMutation.isPending}
            availableSpeakers={speakers}
          />
        ))
      )}
    </>
  )
}
