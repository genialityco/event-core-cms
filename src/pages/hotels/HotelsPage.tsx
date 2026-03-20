import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ChevronLeft, Plus, Pencil, Trash2, BedDouble, Star } from 'lucide-react'
import { hotelsService } from '@/services/hotels'
import { eventsService } from '@/services/events'
import { organizationsService } from '@/services/organizations'
import type { Hotel } from '@/types/hotel'

const EMPTY_FORM: Partial<Hotel> = {
  name: '',
  address: '',
  phone: '',
  price: '',
  bookingUrl: '',
  hotelUrl: '',
  imageUrl: '',
  isMain: false,
  distanceMinutes: undefined,
  order: 0,
}

export default function HotelsPage() {
  const { id: orgId, eventId } = useParams<{ id: string; eventId: string }>()
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Hotel>>(EMPTY_FORM)
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

  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['hotels', eventId],
    queryFn: () => hotelsService.getByEvent(eventId!),
    enabled: !!eventId,
  })

  const createMutation = useMutation({
    mutationFn: (body: Partial<Hotel>) =>
      hotelsService.create({ ...body, eventId, organizationId: org?._id ?? orgId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels', eventId] })
      setShowForm(false)
      setForm(EMPTY_FORM)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Hotel> }) =>
      hotelsService.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels', eventId] })
      setEditingId(null)
      setShowForm(false)
      setForm(EMPTY_FORM)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hotelsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels', eventId] })
      setDeleteConfirmId(null)
    },
  })

  const toggleMainMutation = useMutation({
    mutationFn: ({ id, isMain }: { id: string; isMain: boolean }) =>
      hotelsService.update(id, { isMain }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels', eventId] })
    },
  })

  const handleEdit = (hotel: Hotel) => {
    setForm({
      name: hotel.name,
      address: hotel.address ?? '',
      phone: hotel.phone ?? '',
      price: hotel.price ?? '',
      bookingUrl: hotel.bookingUrl ?? '',
      hotelUrl: hotel.hotelUrl ?? '',
      imageUrl: hotel.imageUrl ?? '',
      isMain: hotel.isMain ?? false,
      distanceMinutes: hotel.distanceMinutes,
      order: hotel.order ?? 0,
    })
    setEditingId(hotel._id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = () => {
    if (!form.name) return
    if (editingId) {
      updateMutation.mutate({ id: editingId, body: form })
    } else {
      createMutation.mutate(form)
    }
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
          <h1 style={{ marginBottom: 1 }}>Hoteles</h1>
          <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-secondary)' }}>
            {org?.name}{event ? ` · ${event.name}` : ''}
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            className="btn btn-primary"
            onClick={() => { handleCancel(); setShowForm(true) }}
          >
            <Plus size={14} /> Nuevo hotel
          </button>
        </div>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20, maxWidth: 560 }}>
          <h3 style={{ marginBottom: 16 }}>{editingId ? 'Editar hotel' : 'Nuevo hotel'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="field-label">Nombre *</label>
              <input
                value={form.name ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nombre del hotel"
                autoFocus
              />
            </div>
            <div>
              <label className="field-label">Dirección</label>
              <input
                value={form.address ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Dirección completa"
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Teléfono</label>
                <input
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+57 300 000 0000"
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
              <label className="field-label">Precios / tarifas</label>
              <input
                value={form.price ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="Desde $200.000 COP por noche"
              />
            </div>
            <div>
              <label className="field-label">URL de reserva</label>
              <input
                value={form.bookingUrl ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, bookingUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="field-label">Sitio web del hotel</label>
              <input
                value={form.hotelUrl ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, hotelUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="field-label">URL de imagen</label>
              <input
                value={form.imageUrl ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={form.isMain ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, isMain: e.target.checked }))}
                />
                <span className="toggle-track" />
                <span className="toggle-thumb" />
              </label>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Hotel principal (sede del evento)
              </span>
            </div>
            {!form.isMain && (
              <div>
                <label className="field-label">Distancia en minutos caminando</label>
                <input
                  type="number"
                  value={form.distanceMinutes ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      distanceMinutes: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  placeholder="15"
                  min={0}
                  style={{ maxWidth: 120 }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!form.name || isPending}
              >
                {isPending ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button className="btn" onClick={handleCancel}>
                Cancelar
              </button>
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
            <div key={i} style={{ height: 80, background: '#f1f5f9', borderRadius: 14 }} />
          ))}
        </div>
      ) : hotels.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <BedDouble size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No hay hoteles. Crea el primero.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hotels.map((hotel: Hotel) => (
            <div
              key={hotel._id}
              className="card"
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderLeft: hotel.isMain ? '3px solid var(--accent)' : '3px solid transparent',
              }}
            >
              <BedDouble size={18} style={{ color: hotel.isMain ? 'var(--accent)' : 'var(--text-secondary)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{hotel.name}</span>
                  {hotel.isMain && (
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 600,
                      color: 'var(--accent)', background: 'var(--accent-soft, #eff6ff)',
                      padding: '2px 8px', borderRadius: 20,
                      border: '1px solid var(--accent)',
                    }}>
                      PRINCIPAL
                    </span>
                  )}
                </div>
                {hotel.address && (
                  <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {hotel.address}
                  </p>
                )}
                {hotel.phone && (
                  <p style={{ margin: '1px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {hotel.phone}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  className="btn"
                  style={{ fontSize: '0.8125rem' }}
                  title={hotel.isMain ? 'Quitar como principal' : 'Marcar como principal'}
                  onClick={() => toggleMainMutation.mutate({ id: hotel._id, isMain: !hotel.isMain })}
                  disabled={toggleMainMutation.isPending}
                >
                  <Star size={13} style={{ fill: hotel.isMain ? 'currentColor' : 'none' }} />
                  {hotel.isMain ? 'Principal' : 'Hacer principal'}
                </button>
                <button
                  className="btn"
                  style={{ fontSize: '0.8125rem' }}
                  onClick={() => handleEdit(hotel)}
                >
                  <Pencil size={13} /> Editar
                </button>
                {deleteConfirmId === hotel._id ? (
                  <>
                    <button
                      className="btn"
                      style={{ fontSize: '0.8125rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                      onClick={() => deleteMutation.mutate(hotel._id)}
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
                    onClick={() => setDeleteConfirmId(hotel._id)}
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
