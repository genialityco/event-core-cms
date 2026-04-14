import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import { organizationsService } from '@/services/organizations'
import { ChevronLeft, Plus, Radio, Settings, BedDouble, CalendarDays, Users, Info, Luggage } from 'lucide-react'
import { useState } from 'react'
import type { Event } from '@/types/event'

export default function EventsPage() {
  const { id: orgId } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')

  const { data: org } = useQuery({
    queryKey: ['organizations', orgId],
    queryFn: () => organizationsService.getById(orgId!),
    enabled: !!orgId,
  })

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', orgId],
    queryFn: () => eventsService.getByOrganization(orgId!),
    enabled: !!orgId,
  })

  const setActiveMutation = useMutation({
    mutationFn: (eventId: string) =>
      organizationsService.update(orgId!, { activeEventId: eventId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId] })
    },
  })

  const createMutation = useMutation({
    mutationFn: () =>
      eventsService.create({
        name: newName,
        organizationId: orgId,
        startDate: newStartDate,
        endDate: newEndDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', orgId] })
      setNewName('')
      setNewStartDate('')
      setNewEndDate('')
      setShowCreate(false)
    },
  })

  const activeEventId = org?.activeEventId

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link
          to={`/organizations/${orgId}`}
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
          <h1 style={{ marginBottom: 1 }}>Eventos</h1>
          {org && <p style={{ fontSize: '0.8125rem', margin: 0 }}>{org.name}</p>}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Nuevo evento
          </button>
        </div>
      </div>

      {/* Formulario crear evento */}
      {showCreate && (
        <div className="card" style={{ padding: 20, marginBottom: 20, maxWidth: 520 }}>
          <h3 style={{ marginBottom: 16 }}>Nuevo evento</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del evento"
              autoFocus
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Fecha de inicio</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Fecha de fin</label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                className="btn btn-primary"
                onClick={() => createMutation.mutate()}
                disabled={!newName || !newStartDate || !newEndDate || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creando...' : 'Crear'}
              </button>
              <button className="btn" onClick={() => { setShowCreate(false); setNewName(''); setNewStartDate(''); setNewEndDate('') }}>
                Cancelar
              </button>
              {createMutation.isError && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--error)', alignSelf: 'center' }}>
                  Error al crear el evento
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lista de eventos */}
      {isLoading ? (
        <div style={{ height: 200, background: '#f1f5f9', borderRadius: 14 }} />
      ) : events.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          No hay eventos. Crea el primero.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map((event: Event) => {
            const isActive = event._id === activeEventId
            return (
              <div
                key={event._id}
                className="card"
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                }}
              >
                {/* Info del evento */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{event.name}</span>
                    {isActive && (
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 600,
                        color: 'var(--accent)', background: 'var(--accent-soft, #eff6ff)',
                        padding: '2px 8px', borderRadius: 20,
                        border: '1px solid var(--accent)',
                      }}>
                        ACTIVO EN APP
                      </span>
                    )}
                  </div>
                  {event.startDate && (
                    <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {new Date(event.startDate).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                      {event.endDate && ` — ${new Date(event.endDate).toLocaleDateString('es-CO', { dateStyle: 'medium' })}`}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {!isActive && (
                    <button
                      className="btn"
                      style={{ fontSize: '0.8125rem' }}
                      onClick={() => setActiveMutation.mutate(event._id)}
                      disabled={setActiveMutation.isPending}
                      title="Activar en la app"
                    >
                      <Radio size={13} /> Activar en app
                    </button>
                  )}
                  <Link
                    to={`/organizations/${orgId}/events/${event._id}/travelers`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button className="btn" style={{ fontSize: '0.8125rem' }} title="Ver registros de viajeros">
                      <Luggage size={13} /> Viajeros
                    </button>
                  </Link>
                  <Link
                    to={`/organizations/${orgId}/events/${event._id}/traveler-config`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button className="btn" style={{ fontSize: '0.8125rem' }} title="Configurar formulario de viajero">
                      <Settings size={13} /> Config viajero
                    </button>
                  </Link>
                  <Link
                    to={`/organizations/${orgId}/events/${event._id}/hotels`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button className="btn" style={{ fontSize: '0.8125rem' }} title="Gestionar hoteles">
                      <BedDouble size={13} /> Hotels
                    </button>
                  </Link>
                  <Link
                    to={`/organizations/${orgId}/events/${event._id}/agenda`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button className="btn" style={{ fontSize: '0.8125rem' }} title="Gestionar agenda">
                      <CalendarDays size={13} /> Agenda
                    </button>
                  </Link>
                  <Link
                    to={`/organizations/${orgId}/events/${event._id}/speakers`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button className="btn" style={{ fontSize: '0.8125rem' }} title="Gestionar conferencistas">
                      <Users size={13} /> Speakers
                    </button>
                  </Link>
                  <Link
                    to={`/organizations/${orgId}/events/${event._id}/useful-info`}
                    style={{ textDecoration: 'none' }}
                  >
                    <button className="btn" style={{ fontSize: '0.8125rem' }} title="Gestionar info útil">
                      <Info size={13} /> Info Útil
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
