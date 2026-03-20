import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ChevronLeft, Plus, Pencil, Trash2, Eye, EyeOff, BookOpen } from 'lucide-react'
import { usefulInfoService } from '@/services/useful-info'
import { eventsService } from '@/services/events'
import { organizationsService } from '@/services/organizations'
import type { UsefulInfo } from '@/types/useful-info'
import { CATEGORIES } from '@/types/useful-info'

const EMPTY_FORM: Partial<UsefulInfo> = {
  title: '',
  category: 'general',
  icon: '',
  content: '',
  coverImageUrl: '',
  isPublished: false,
  order: 0,
}

export default function UsefulInfoPage() {
  const { id: orgId, eventId } = useParams<{ id: string; eventId: string }>()
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<UsefulInfo>>(EMPTY_FORM)
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

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['useful-info', eventId],
    queryFn: () => usefulInfoService.getByEvent(eventId!),
    enabled: !!eventId,
  })

  const createMutation = useMutation({
    mutationFn: (body: Partial<UsefulInfo>) =>
      usefulInfoService.create({ ...body, eventId, organizationId: org?._id ?? orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['useful-info', eventId] })
      setShowForm(false)
      setForm(EMPTY_FORM)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<UsefulInfo> }) =>
      usefulInfoService.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['useful-info', eventId] })
      setEditingId(null)
      setShowForm(false)
      setForm(EMPTY_FORM)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usefulInfoService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['useful-info', eventId] })
      setDeleteConfirmId(null)
    },
  })

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      usefulInfoService.update(id, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['useful-info', eventId] })
    },
  })

  const handleEdit = (item: UsefulInfo) => {
    setForm({
      title: item.title,
      category: item.category ?? 'general',
      icon: item.icon ?? '',
      content: item.content ?? '',
      coverImageUrl: item.coverImageUrl ?? '',
      isPublished: item.isPublished ?? false,
      order: item.order ?? 0,
    })
    setEditingId(item._id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = () => {
    if (!form.title) return
    if (editingId) {
      updateMutation.mutate({ id: editingId, body: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const getCategoryLabel = (key: string) => CATEGORIES.find((c) => c.key === key)?.label ?? key
  const getCategoryIcon = (item: UsefulInfo) => {
    if (item.icon) return item.icon
    return CATEGORIES.find((c) => c.key === item.category)?.icon ?? '📌'
  }

  const isPending = createMutation.isPending || updateMutation.isPending

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
          <h1 style={{ marginBottom: 1 }}>Info Útil</h1>
          <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-secondary)' }}>
            {org?.name}{event ? ` · ${event.name}` : ''}
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            className="btn btn-primary"
            onClick={() => { handleCancel(); setShowForm(true) }}
          >
            <Plus size={14} /> Nuevo artículo
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20, maxWidth: 680 }}>
          <h3 style={{ marginBottom: 16 }}>{editingId ? 'Editar artículo' : 'Nuevo artículo'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="field-label">Título *</label>
              <input
                value={form.title ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Requisitos de visa para Colombia"
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 2 }}>
                <label className="field-label">Categoría</label>
                <select
                  value={form.category ?? 'general'}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  style={{
                    width: '100%', height: 36, padding: '0 10px',
                    border: '1px solid var(--border)', borderRadius: 8,
                    background: 'var(--surface)', color: 'var(--text-primary)',
                    fontFamily: 'var(--font)', fontSize: '0.875rem',
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Icono (emoji)</label>
                <input
                  value={form.icon ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="🛂 (opcional)"
                  style={{ textAlign: 'center', fontSize: '1.25rem' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Orden</label>
                <input
                  type="number"
                  value={form.order ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                  min={0}
                />
              </div>
            </div>

            <div>
              <label className="field-label">
                Contenido
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8, fontSize: '0.75rem' }}>
                  Soporta # Título, ## Subtítulo, **negrita**, - listas
                </span>
              </label>
              <textarea
                value={form.content ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder={'# Título principal\n\n## Subtítulo\n\nEscribe el contenido aquí...\n\n- Punto uno\n- Punto dos\n\n**Texto en negrita**'}
                style={{
                  width: '100%', height: 280, padding: '10px 12px',
                  border: '1px solid var(--border)', borderRadius: 8,
                  background: 'var(--surface)', color: 'var(--text-primary)',
                  fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.6,
                  resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label className="field-label">URL de imagen de portada (opcional)</label>
              <input
                value={form.coverImageUrl ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.isPublished ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                />
                <span className="toggle-track" />
                <span className="toggle-thumb" />
              </label>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Publicado (visible en la app)
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!form.title || isPending}
              >
                {isPending ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button className="btn" onClick={handleCancel}>Cancelar</button>
              {(createMutation.isError || updateMutation.isError) && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--error)', alignSelf: 'center' }}>
                  Error al guardar
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 72, background: '#f1f5f9', borderRadius: 14 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <BookOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No hay artículos. Crea el primero.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item: UsefulInfo) => (
            <div
              key={item._id}
              className="card"
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                borderLeft: item.isPublished ? '3px solid var(--accent)' : '3px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 24, flexShrink: 0 }}>{getCategoryIcon(item)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{item.title}</span>
                  <span style={{
                    fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}>
                    {getCategoryLabel(item.category)}
                  </span>
                </div>
                {item.content && (
                  <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 480 }}>
                    {item.content.replace(/[#*\-]/g, '').slice(0, 100)}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  background: item.isPublished ? '#dcfce7' : '#f1f5f9',
                  color: item.isPublished ? '#16a34a' : 'var(--text-secondary)',
                  border: `1px solid ${item.isPublished ? '#bbf7d0' : 'var(--border)'}`,
                }}>
                  {item.isPublished ? 'Publicado' : 'Borrador'}
                </span>
                <button
                  className="btn"
                  style={{ fontSize: '0.8125rem' }}
                  title={item.isPublished ? 'Ocultar' : 'Publicar'}
                  onClick={() => togglePublishMutation.mutate({ id: item._id, isPublished: !item.isPublished })}
                  disabled={togglePublishMutation.isPending}
                >
                  {item.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button
                  className="btn"
                  style={{ fontSize: '0.8125rem' }}
                  onClick={() => handleEdit(item)}
                >
                  <Pencil size={13} /> Editar
                </button>
                {deleteConfirmId === item._id ? (
                  <>
                    <button
                      className="btn"
                      style={{ fontSize: '0.8125rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                      onClick={() => deleteMutation.mutate(item._id)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar'}
                    </button>
                    <button className="btn" style={{ fontSize: '0.8125rem' }} onClick={() => setDeleteConfirmId(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    className="btn"
                    style={{ fontSize: '0.8125rem' }}
                    onClick={() => setDeleteConfirmId(item._id)}
                  >
                    <Trash2 size={13} /> Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
