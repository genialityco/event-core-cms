export interface AttendanceMemberProperties {
  email?: string
  name?: string
  names?: string
  fullName?: string
  [key: string]: unknown
}

export interface AttendanceMember {
  _id?: string
  properties?: AttendanceMemberProperties
}

export interface SessionAttendanceRecord {
  _id: string
  eventId: string
  agendaId: string
  sessionId: string
  memberId: string | AttendanceMember
  userId: string
  status: 'registered' | 'attended'
  createdAt?: string
  updatedAt?: string
}

export interface RequiredAttendanceSession {
  _id: string
  title: string
  titleEn?: string
  startDateTime?: string
  endDateTime?: string
  room?: string
  roomEn?: string
  typeSession?: string
  typeSessionEn?: string
  requiresAttendance?: boolean
  attendees: SessionAttendanceRecord[]
}

export interface RequiredAttendanceAgenda {
  _id: string
  sessions: RequiredAttendanceSession[]
}