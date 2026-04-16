import { api } from './api'

export interface PreRegisteredAttendee {
  _id: string
  email: string
  organizationId: string
  eventId: string | null
  name: string | null
  isActivated: boolean
  activatedAt: string | null
  createdAt: string
}

export const preRegistrationService = {
  getAll: async (orgId: string, eventId?: string): Promise<PreRegisteredAttendee[]> => {
    const params = eventId ? `?eventId=${eventId}` : ''
    const { data } = await api.get(`/admin/organizations/${orgId}/pre-registered${params}`)
    return data.data?.items ?? []
  },

  addOne: async (
    orgId: string,
    payload: { email: string; name?: string; eventId?: string },
  ): Promise<PreRegisteredAttendee> => {
    const { data } = await api.post(`/admin/organizations/${orgId}/pre-registered`, payload)
    return data.data
  },

  bulkImport: async (
    orgId: string,
    emails: Array<{ email: string; name?: string }>,
    eventId?: string,
  ): Promise<{ inserted: number; skipped: number }> => {
    const { data } = await api.post(`/admin/organizations/${orgId}/pre-registered/bulk`, {
      emails,
      eventId,
    })
    return data.data
  },

  remove: async (orgId: string, id: string): Promise<void> => {
    await api.delete(`/admin/organizations/${orgId}/pre-registered/${id}`)
  },

  toggleRequirement: async (
    orgId: string,
    requirePreRegistration: boolean,
  ): Promise<void> => {
    await api.patch(`/admin/organizations/${orgId}/pre-registered/toggle`, {
      requirePreRegistration,
    })
  },
}
