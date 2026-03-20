import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ChevronLeft, Plus, Pencil, Trash2, Users } from 'lucide-react'
import { speakersService, type Speaker } from '@/services/speakers'
import { eventsService } from '@/services/events'
import { organizationsService } from '@/services/organizations'

const EMPTY_FORM = {
  names: '',
  role: '',
  organization: '',
  description: '',
  imageUrl: '',
  isInternational: false,
}

function SpeakerForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: typeof EMPTY_FORM
  onSave: (data: typeof EMPTY_FORM) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [form, setForm] = useState(initial)

  return (
    <div
      style={{
        background: 'var(--bg-secondary, #f8fafc)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <h3 style={{ marginBottom: 16, marginTop: 0 }}>
        {initial.names ? 'Editar conferencista' : 'Nuevo conferencista'}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label className="field-label">Nombre completo *</label>
          <input
            value={form.names}
            onChange={(e) => setForm((f) => ({ ...f, names: e.target.value }))}
            placeholder="Nombre completo"
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Cargo / Posición</label>
            <input
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="Director General, CEO..."
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-label">Empresa / Medio</label>
            <input
              value={form.organization}
              onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
              placeholder="Televisión Azteca, TV Globo..."
            />
          </div>
        </div>
        <div>
          <label className="field-label">Biografía</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Breve descripción o biografía"
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <div>
          <label className="field-label">URL de foto</label>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            placeholder="https://..."
          />
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="preview"
              style={{
                width: 64, height: 64, borderRadius: '50%',
                objectFit: 'cover', marginTop: 8,
                border: '2px solid var(--border)',
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            id="isInternational"
            type="checkbox"
            checked={form.isInternational}
            onChange={(e) => setForm((f) => ({ ...f, isInternational: e.target.checked }))}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor="isInternational" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
            Internacional
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            className="btn btn-primary"
            onClick={() => onSave(form)}
            disabled={!form.names || isPending}
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="btn" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function SpeakersPage() {
  const { id: orgId, eventId } = useParams<{ id: string; eventId: string }>()
  const queryClient = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

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

  const { data: speakers = [], isLoading } = useQuery<Speaker[]>({
    queryKey: ['speakers', eventId],
    queryFn: () => speakersService.getByEvent(eventId!),
    enabled: !!eventId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['speakers', eventId] })

  const createMutation = useMutation({
    mutationFn: (body: Partial<Speaker>) =>
      speakersService.create({ ...body, eventId }),
    onSuccess: () => {
      invalidate()
      setShowCreate(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Speaker> }) =>
      speakersService.update(id, body),
    onSuccess: () => {
      invalidate()
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => speakersService.remove(id),
    onSuccess: () => {
      invalidate()
      setDeleteConfirmId(null)
    },
  })

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
          <h1 style={{ marginBottom: 1 }}>Conferencistas</h1>
          <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-secondary)' }}>
            {org?.name}{event ? ` · ${event.name}` : ''}
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            className="btn btn-primary"
            onClick={() => { setShowCreate(true); setEditingId(null) }}
            disabled={showCreate}
          >
            <Plus size={14} /> Nuevo conferencista
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <SpeakerForm
          initial={EMPTY_FORM}
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setShowCreate(false)}
          isPending={createMutation.isPending}
        />
      )}

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 72, background: '#f1f5f9', borderRadius: 10 }} />
          ))}
        </div>
      ) : speakers.length === 0 && !showCreate ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No hay conferencistas. Añade el primero.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {speakers.map((speaker) => (
            <div key={speaker._id}>
              {editingId === speaker._id ? (
                <SpeakerForm
                  initial={{
                    names: speaker.names,
                    role: speaker.role ?? '',
                    organization: speaker.organization ?? '',
                    description: speaker.description ?? '',
                    imageUrl: speaker.imageUrl ?? '',
                    isInternational: speaker.isInternational ?? false,
                  }}
                  onSave={(data) => updateMutation.mutate({ id: speaker._id, body: data })}
                  onCancel={() => setEditingId(null)}
                  isPending={updateMutation.isPending}
                />
              ) : (
                <div
                  className="card"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  {/* Avatar */}
                  {speaker.imageUrl ? (
                    <img
                      src={speaker.imageUrl}
                      alt={speaker.names}
                      style={{
                        width: 48, height: 48, borderRadius: '50%',
                        objectFit: 'cover', flexShrink: 0,
                        border: '1px solid var(--border)',
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'var(--accent-soft, #eff6ff)',
                        color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                        border: '1px solid var(--accent)',
                      }}
                    >
                      {getInitials(speaker.names)}
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{speaker.names}</span>
                      {speaker.isInternational && (
                        <span style={{
                          fontSize: '0.6875rem', fontWeight: 600,
                          color: '#1d4ed8', background: '#dbeafe',
                          padding: '2px 8px', borderRadius: 20,
                          border: '1px solid #93c5fd',
                        }}>
                          Internacional
                        </span>
                      )}
                    </div>
                    {(speaker.role || speaker.organization) && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {[speaker.role, speaker.organization].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      className="btn"
                      style={{ fontSize: '0.8125rem' }}
                      onClick={() => { setEditingId(speaker._id); setShowCreate(false) }}
                    >
                      <Pencil size={12} /> Editar
                    </button>
                    {deleteConfirmId === speaker._id ? (
                      <>
                        <button
                          className="btn"
                          style={{ fontSize: '0.8125rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                          onClick={() => deleteMutation.mutate(speaker._id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar'}
                        </button>
                        <button
                          className="btn"
                          style={{ fontSize: '0.8125rem' }}
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn"
                        style={{ fontSize: '0.8125rem' }}
                        onClick={() => setDeleteConfirmId(speaker._id)}
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
    </>
  )
}
