import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ChevronLeft, Luggage, Trash2, Download } from 'lucide-react'
import { travelersService } from '@/services/travelers'
import { eventsService } from '@/services/events'
import { organizationsService } from '@/services/organizations'
import type { TravelerInfo } from '@/types/traveler'

function fmt(val: string | null | undefined) {
  return val && val.trim() ? val : '—'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'short' })
}

export default function TravelersPage() {
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

  const { data: travelers = [], isLoading } = useQuery({
    queryKey: ['travelers', eventId],
    queryFn: () => travelersService.getByEvent(eventId!),
    enabled: !!eventId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => travelersService.remove(eventId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travelers', eventId] })
      setDeleteConfirmId(null)
    },
  })

  const handleExportCsv = () => {
    if (!travelers.length) return

    const headers = [
      'Email', 'Canal / Empresa', 'Cargo',
      'Vuelo ida - Ciudad', 'Vuelo ida - N°', 'Vuelo ida - Llegada',
      'Vuelo regreso - Ciudad', 'Vuelo regreso - N°', 'Vuelo regreso - Salida',
      'Restricciones dietéticas', 'Registrado',
    ]

    const rows = travelers.map((t) => [
      t.userEmail ?? '',
      t.tvChannel ?? '',
      t.position ?? '',
      t.outboundOriginCity ?? '',
      t.outboundFlightNumber ?? '',
      t.outboundArrivalTime ?? '',
      t.returnOriginCity ?? '',
      t.returnFlightNumber ?? '',
      t.returnArrivalTime ?? '',
      t.dietaryRestrictions ?? '',
      t.createdAt ? formatDate(t.createdAt) : '',
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `viajeros-${event?.name ?? eventId}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
          <h1 style={{ marginBottom: 1 }}>Viajeros</h1>
          <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-secondary)' }}>
            {org?.name}{event ? ` · ${event.name}` : ''}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {travelers.length > 0 && (
            <button className="btn" onClick={handleExportCsv}>
              <Download size={14} /> Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Counter */}
      {!isLoading && travelers.length > 0 && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          {travelers.length} {travelers.length === 1 ? 'registro' : 'registros'}
        </p>
      )}

      {/* Table */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 48, background: '#f1f5f9', borderRadius: 10 }} />
          ))}
        </div>
      ) : travelers.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Luggage size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>Ningún usuario ha completado el formulario de viajero.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface, #f8fafc)', borderBottom: '1px solid var(--border)' }}>
                  {[
                    'Email',
                    'Canal / Empresa',
                    'Cargo',
                    'Vuelo ida',
                    'N° vuelo ida',
                    'Llegada ida',
                    'Vuelo regreso',
                    'N° vuelo reg.',
                    'Salida reg.',
                    'Dieta',
                    'Registrado',
                    '',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {travelers.map((t: TravelerInfo, idx: number) => (
                  <tr
                    key={t._id}
                    style={{
                      borderBottom: idx < travelers.length - 1 ? '1px solid var(--border)' : 'none',
                      background: idx % 2 === 0 ? 'transparent' : 'var(--surface, #f8fafc)',
                    }}
                  >
                    <td style={{ padding: '10px 14px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {fmt(t.userEmail)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{fmt(t.tvChannel)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{fmt(t.position)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{fmt(t.outboundOriginCity)}</td>
                    <td style={{ padding: '10px 14px' }}>{fmt(t.outboundFlightNumber)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{fmt(t.outboundArrivalTime)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{fmt(t.returnOriginCity)}</td>
                    <td style={{ padding: '10px 14px' }}>{fmt(t.returnFlightNumber)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{fmt(t.returnArrivalTime)}</td>
                    <td style={{ padding: '10px 14px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fmt(t.dietaryRestrictions)}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {t.createdAt ? formatDate(t.createdAt) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {deleteConfirmId === t._id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn"
                            style={{ fontSize: '0.75rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                            onClick={() => deleteMutation.mutate(t._id)}
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
                          onClick={() => setDeleteConfirmId(t._id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
