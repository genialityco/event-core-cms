import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ChevronLeft, Image as ImageIcon, Trash2 } from 'lucide-react'
import { photosService } from '@/services/photos'
import { eventsService } from '@/services/events'
import { organizationsService } from '@/services/organizations'
import type { Photo } from '@/types/photo'

function fmt(value: string | null | undefined) {
  if (!value || !value.trim()) return '—'
  return value
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function PhotosPage() {
  const { id: orgId, eventId } = useParams<{ id: string; eventId: string }>()
  const queryClient = useQueryClient()
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

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos', eventId],
    queryFn: () => photosService.getByEvent(eventId!),
    enabled: !!eventId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => photosService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', eventId] })
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          <ChevronLeft size={16} />
        </Link>
        <div>
          <h1 style={{ marginBottom: 1 }}>Fotos</h1>
          <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-secondary)' }}>
            {org?.name}{event ? ` · ${event.name}` : ''}
          </p>
        </div>
      </div>

      {!isLoading && photos.length > 0 && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          {photos.length} {photos.length === 1 ? 'registro' : 'registros'}
        </p>
      )}

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 220, background: '#f1f5f9', borderRadius: 14 }} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <ImageIcon size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>Aún no hay fotos subidas para este evento.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {photos.map((photo: Photo) => (
            <div key={photo._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ aspectRatio: '16 / 10', background: '#f8fafc', overflow: 'hidden' }}>
                <a href={photo.imageUrl} target="_blank" rel="noreferrer">
                  <img
                    src={photo.imageUrl}
                    alt={photo.userName ?? photo.userId}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </a>
              </div>

              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 2 }}>
                    {fmt(photo.userName)}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {fmt(photo.userId)}
                  </div>
                </div>

                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Subida el {photo.createdAt ? formatDate(photo.createdAt) : '—'}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                  <a
                    href={photo.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none' }}
                  >
                    Ver imagen
                  </a>

                  {deleteConfirmId === photo._id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn"
                        style={{ fontSize: '0.75rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                        onClick={() => deleteMutation.mutate(photo._id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar'}
                      </button>
                      <button
                        className="btn"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setDeleteConfirmId(photo._id)}
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
