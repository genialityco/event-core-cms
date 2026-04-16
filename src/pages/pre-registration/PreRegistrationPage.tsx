import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { ChevronLeft, UserCheck, Trash2, Upload, Plus, ToggleLeft, ToggleRight, Download } from 'lucide-react'
import { preRegistrationService } from '@/services/preRegistration'
import type { PreRegisteredAttendee } from '@/services/preRegistration'
import { eventsService } from '@/services/events'
import { organizationsService } from '@/services/organizations'

function fmt(val: string | null | undefined) {
  return val && val.trim() ? val : '—'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'short' })
}

export default function PreRegistrationPage() {
  const { id: orgId, eventId } = useParams<{ id: string; eventId: string }>()
  const queryClient = useQueryClient()
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ inserted: number; skipped: number } | null>(null)

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

  const { data: attendees = [], isLoading } = useQuery({
    queryKey: ['pre-registered', orgId, eventId],
    queryFn: () => preRegistrationService.getAll(orgId!, eventId),
    enabled: !!orgId,
  })

  const requirePreRegistration = !!(org as any)?.auth?.requirePreRegistration

  const toggleMutation = useMutation({
    mutationFn: (value: boolean) =>
      preRegistrationService.toggleRequirement(orgId!, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId] })
    },
  })

  const addMutation = useMutation({
    mutationFn: () =>
      preRegistrationService.addOne(orgId!, {
        email: newEmail.trim(),
        name: newName.trim() || undefined,
        eventId: eventId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-registered', orgId, eventId] })
      setNewEmail('')
      setNewName('')
    },
  })

  const bulkMutation = useMutation({
    mutationFn: () => {
      const lines = bulkText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)

      const emails = lines.map((line) => {
        const [email, name] = line.split(',').map((s) => s.trim())
        return { email, name: name || undefined }
      })

      return preRegistrationService.bulkImport(orgId!, emails, eventId)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pre-registered', orgId, eventId] })
      setBulkText('')
      setBulkResult(result)
      setShowBulk(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => preRegistrationService.remove(orgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pre-registered', orgId, eventId] })
      setDeleteConfirmId(null)
    },
  })

  const handleExportCsv = () => {
    if (!attendees.length) return
    const headers = ['Email', 'Nombre', 'Activado', 'Fecha activación', 'Pre-registrado']
    const rows = (attendees as PreRegisteredAttendee[]).map((a) => [
      a.email,
      a.name ?? '',
      a.isActivated ? 'Sí' : 'No',
      a.activatedAt ? formatDate(a.activatedAt) : '',
      formatDate(a.createdAt),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pre-registrados-${event?.name ?? eventId ?? orgId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activated = (attendees as PreRegisteredAttendee[]).filter((a) => a.isActivated).length
  const pending = attendees.length - activated

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link
          to={eventId ? `/organizations/${orgId}/events` : `/organizations/${orgId}`}
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
          <h1 style={{ marginBottom: 1 }}>Pre-registro de asistentes</h1>
          <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-secondary)' }}>
            {org?.name}{event ? ` · ${event.name}` : ''}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {attendees.length > 0 && (
            <button className="btn" onClick={handleExportCsv}>
              <Download size={14} /> Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Toggle de validación */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: requirePreRegistration ? '#f0fdf4' : undefined,
          borderLeft: `3px solid ${requirePreRegistration ? '#22c55e' : 'var(--border)'}`,
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem' }}>
            Validación de correo pre-registrado
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {requirePreRegistration
              ? 'Activa — solo correos en esta lista pueden registrarse en la app.'
              : 'Desactivada — cualquier correo puede registrarse en la app.'}
          </p>
        </div>
        <button
          className="btn"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: requirePreRegistration ? '#dcfce7' : undefined,
            borderColor: requirePreRegistration ? '#86efac' : undefined,
            color: requirePreRegistration ? '#15803d' : undefined,
          }}
          onClick={() => toggleMutation.mutate(!requirePreRegistration)}
          disabled={toggleMutation.isPending}
        >
          {requirePreRegistration ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          {requirePreRegistration ? 'Desactivar' : 'Activar'}
        </button>
      </div>

      {/* Estadísticas */}
      {!isLoading && attendees.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total', value: attendees.length, color: 'var(--text-primary)' },
            { label: 'Activados', value: activated, color: '#16a34a' },
            { label: 'Pendientes', value: pending, color: '#d97706' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="card"
              style={{ padding: '12px 20px', flex: 1, textAlign: 'center' }}
            >
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color }}>{value}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Resultado de importación */}
      {bulkResult && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            background: '#f0fdf4',
            borderLeft: '3px solid #22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: '#15803d' }}>
            ✓ {bulkResult.inserted} correo{bulkResult.inserted !== 1 ? 's' : ''} importado{bulkResult.inserted !== 1 ? 's' : ''}.
            {bulkResult.skipped > 0 && ` ${bulkResult.skipped} duplicado${bulkResult.skipped !== 1 ? 's' : ''} omitido${bulkResult.skipped !== 1 ? 's' : ''}.`}
          </span>
          <button
            className="btn"
            style={{ fontSize: '0.75rem' }}
            onClick={() => setBulkResult(null)}
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Agregar uno */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12, fontSize: '0.9375rem' }}>Agregar correo</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            style={{ flex: '1 1 220px' }}
            onKeyDown={(e) => e.key === 'Enter' && newEmail && addMutation.mutate()}
          />
          <input
            type="text"
            placeholder="Nombre (opcional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: '1 1 160px' }}
          />
          <button
            className="btn btn-primary"
            onClick={() => addMutation.mutate()}
            disabled={!newEmail.trim() || addMutation.isPending}
          >
            <Plus size={14} />
            {addMutation.isPending ? 'Agregando...' : 'Agregar'}
          </button>
          <button
            className="btn"
            onClick={() => setShowBulk(!showBulk)}
          >
            <Upload size={14} /> Importar masivo
          </button>
        </div>
        {addMutation.isError && (
          <p style={{ color: 'var(--error)', fontSize: '0.8125rem', marginTop: 8 }}>
            {(addMutation.error as any)?.response?.data?.message ?? 'Error al agregar el correo.'}
          </p>
        )}

        {/* Importación masiva */}
        {showBulk && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Un correo por línea. Formato opcional: <code>correo@ejemplo.com, Nombre</code>
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`ana@empresa.com, Ana García\nbob@empresa.com\ncelia@empresa.com, Celia López`}
              rows={6}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => bulkMutation.mutate()}
                disabled={!bulkText.trim() || bulkMutation.isPending}
              >
                {bulkMutation.isPending ? 'Importando...' : 'Importar'}
              </button>
              <button className="btn" onClick={() => { setShowBulk(false); setBulkText('') }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 48, background: '#f1f5f9', borderRadius: 10 }} />
          ))}
        </div>
      ) : attendees.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <UserCheck size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No hay correos pre-registrados. Agrega el primero arriba.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface, #f8fafc)', borderBottom: '1px solid var(--border)' }}>
                  {['Email', 'Nombre', 'Estado', 'Activado', 'Pre-registrado', ''].map((h) => (
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
                {(attendees as PreRegisteredAttendee[]).map((a, idx) => (
                  <tr
                    key={a._id}
                    style={{
                      borderBottom: idx < attendees.length - 1 ? '1px solid var(--border)' : 'none',
                      background: idx % 2 === 0 ? 'transparent' : 'var(--surface, #f8fafc)',
                    }}
                  >
                    <td style={{ padding: '10px 14px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {a.email}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{fmt(a.name)}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: a.isActivated ? '#dcfce7' : '#fef9c3',
                          color: a.isActivated ? '#15803d' : '#92400e',
                          border: `1px solid ${a.isActivated ? '#86efac' : '#fde68a'}`,
                        }}
                      >
                        {a.isActivated ? '✓ Activado' : '⏳ Pendiente'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {a.activatedAt ? formatDate(a.activatedAt) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {formatDate(a.createdAt)}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {deleteConfirmId === a._id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn"
                            style={{ fontSize: '0.75rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                            onClick={() => deleteMutation.mutate(a._id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar'}
                          </button>
                          <button className="btn" style={{ fontSize: '0.75rem' }} onClick={() => setDeleteConfirmId(null)}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setDeleteConfirmId(a._id)}
                          disabled={a.isActivated}
                          title={a.isActivated ? 'No se puede eliminar un correo ya activado' : 'Eliminar'}
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
