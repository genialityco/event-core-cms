import { api } from './api'
import type { RequiredAttendanceAgenda, SessionAttendanceRecord } from '@/types/attendance'

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object') {
    const record = value as { items?: unknown; data?: unknown }
    if (Array.isArray(record.items)) return record.items as T[]
    if (Array.isArray(record.data)) return record.data as T[]
  }
  return []
}

function normalizeAttendees(attendees: SessionAttendanceRecord[]): SessionAttendanceRecord[] {
  const byId = new Map<string, SessionAttendanceRecord>()

  for (const attendee of attendees) {
    const memberKey = typeof attendee.memberId === 'object' && attendee.memberId && '_id' in attendee.memberId
      ? String((attendee.memberId as { _id?: string })._id ?? '')
      : String(attendee.memberId)
    const key = attendee._id || `${attendee.sessionId}:${memberKey}`
    if (!byId.has(key)) {
      byId.set(key, attendee)
    }
  }

  return [...byId.values()]
}

export const attendanceRequiredService = {
  getByEvent: async (eventId: string): Promise<RequiredAttendanceAgenda[]> => {
    const { data } = await api.get(`/admin/events/${eventId}/attendance-required`)
    const items = toArray<RequiredAttendanceAgenda>(data?.data?.items ?? data?.data ?? data)

    return items.map((agenda) => ({
      ...agenda,
      sessions: (agenda.sessions ?? []).map((session) => ({
        ...session,
        attendees: normalizeAttendees(toArray<SessionAttendanceRecord>(session.attendees ?? [])),
      })),
    }))
  },
}