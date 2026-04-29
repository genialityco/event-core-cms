import { useMemo } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Users, CalendarDays, MapPin, Mail, UserRound } from 'lucide-react'
import { organizationsService } from '@/services/organizations'
import { eventsService } from '@/services/events'
import { attendanceRequiredService } from '@/services/attendance-required'
import type { RequiredAttendanceAgenda, RequiredAttendanceSession, SessionAttendanceRecord } from '@/types/attendance'

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return `${date.toLocaleDateString('es-CO', { dateStyle: 'medium' })} · ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

function formatDateTimeRange(start?: string, end?: string) {
  if (!start && !end) return '—'
  if (start && !end) return formatDateTime(start)
  if (!start && end) return formatDateTime(end)

  const startDate = new Date(start!)
  const endDate = new Date(end!)
  const sameDay = startDate.toDateString() === endDate.toDateString()

  if (sameDay) {
    const date = startDate.toLocaleDateString('es-CO', { dateStyle: 'medium' })
    const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${date} · ${startTime} → ${endTime}`
  }

  return `${formatDateTime(start)} → ${formatDateTime(end)}`
}

function getMemberInfo(record: SessionAttendanceRecord) {
  const member = (() => {
    if (typeof record.memberId === 'object' && record.memberId) return record.memberId
    if ('member' in (record as any) && (record as any).member) return (record as any).member
    return null
  })()

  const properties = member?.properties ?? (record as any).member?.properties ?? {}

  const email = properties.email ?? record.userId ?? '—'
  const name = properties.name ?? properties.names ?? properties.fullName ?? '—'

  return { email, name }
}

function SessionCard({ session }: { session: RequiredAttendanceSession }) {
  const attendees = useMemo(() => [...(session.attendees ?? [])], [session.attendees])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <div style={{ padding: '14px 16px', background: 'var(--bg-secondary, #f8fafc)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '0.98rem' }}>{session.title}</h3>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: '#b45309',
                background: '#fef9c3',
                padding: '2px 8px',
                borderRadius: 20,
                border: '1px solid #fde047',
              }}>
                Asistencia requerida
              </span>
            </div>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <CalendarDays size={14} />
                <span>{formatDateTimeRange(session.startDateTime, session.endDateTime)}</span>
              </div>
              {(session.room || session.roomEn) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} />
                  <span>{session.room ?? '—'}{session.roomEn ? ` / ${session.roomEn}` : ''}</span>
                </div>
              )}
            </div>
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--accent)',
            background: 'var(--accent-soft, #eff6ff)',
            border: '1px solid var(--accent)',
            padding: '4px 10px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}>
            {attendees.length} {attendees.length === 1 ? 'usuario' : 'usuarios'}
          </span>
        </div>
      </div>

      {attendees.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Users size={28} style={{ opacity: 0.35, margin: '0 auto 10px' }} />
          <p style={{ margin: 0 }}>Sin usuarios registrados</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface, #f8fafc)', borderBottom: '1px solid var(--border)' }}>
                {['Correo', 'Nombre'].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendees.map((attendee, index) => {
                const { email, name } = getMemberInfo(attendee)

                return (
                  <tr
                    key={attendee._id}
                    style={{
                      borderBottom: index < attendees.length - 1 ? '1px solid var(--border)' : 'none',
                      background: index % 2 === 0 ? 'transparent' : 'var(--surface, #f8fafc)',
                    }}
                  >
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mail size={13} style={{ color: 'var(--text-secondary)' }} />
                        <span>{email}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserRound size={13} style={{ color: 'var(--text-secondary)' }} />
                        <span>{name}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function AttendanceRequiredPage() {
  const { id: orgId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const queryEventId = searchParams.get('eventId') ?? undefined

  const { data: org } = useQuery({
    queryKey: ['organizations', orgId],
    queryFn: () => organizationsService.getById(orgId!),
    enabled: !!orgId,
  })

  const resolvedEventId = queryEventId || org?.activeEventId || ''

  const { data: event } = useQuery({
    queryKey: ['events', resolvedEventId],
    queryFn: () => eventsService.getById(resolvedEventId),
    enabled: !!resolvedEventId,
  })

  const { data: agendas = [], isLoading } = useQuery<RequiredAttendanceAgenda[]>({
    queryKey: ['attendance-required', resolvedEventId],
    queryFn: () => attendanceRequiredService.getByEvent(resolvedEventId),
    enabled: !!resolvedEventId,
  })

  const totalSessions = useMemo(
    () => agendas.reduce((acc, agenda) => acc + agenda.sessions.length, 0),
    [agendas],
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link
          to={orgId ? `/organizations/${orgId}/events` : '/organizations'}
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
          <h1 style={{ marginBottom: 1 }}>Asistentes</h1>
          <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-secondary)' }}>
            {org?.name}{event ? ` · ${event.name}` : ''}
          </p>
        </div>
      </div>

      {!resolvedEventId && (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>Esta organización no tiene un evento activo para mostrar asistentes.</p>
        </div>
      )}

      {resolvedEventId && !isLoading && totalSessions > 0 && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          {totalSessions} {totalSessions === 1 ? 'sesión con asistencia requerida' : 'sesiones con asistencia requerida'}
        </p>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 180, background: '#f1f5f9', borderRadius: 14 }} />
          ))}
        </div>
      ) : resolvedEventId && agendas.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No hay sesiones con asistencia requerida en este evento.</p>
        </div>
      ) : resolvedEventId ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {agendas.map((agenda, index) => (
            <section key={agenda._id} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CalendarDays size={18} style={{ color: 'var(--text-secondary)' }} />
                <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Agenda {index + 1}</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {agenda.sessions.map((session) => (
                  <SessionCard key={session._id} session={session} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </>
  )
}