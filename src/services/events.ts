import { api } from './api'
import type { Event, TravelerFormConfig } from '@/types/event'

export const eventsService = {
  // ── Eventos ────────────────────────────────────────────────────────────────

  getByOrganization: async (organizationId: string): Promise<Event[]> => {
    const { data } = await api.get('/admin/events', { params: { organizationId } })
    return data.data?.items ?? data.data ?? []
  },

  getById: async (id: string): Promise<Event> => {
    const { data } = await api.get(`/admin/events/${id}`)
    return data.data ?? data
  },

  create: async (body: Partial<Event>): Promise<Event> => {
    const { data } = await api.post('/admin/events', body)
    return data.data ?? data
  },

  update: async (id: string, body: Partial<Event>): Promise<Event> => {
    const { data } = await api.put(`/admin/events/${id}`, body)
    return data.data ?? data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/events/${id}`)
  },

  // ── TravelerFormConfig ─────────────────────────────────────────────────────

  getFormConfig: async (eventId: string): Promise<TravelerFormConfig> => {
    const { data } = await api.get(`/admin/events/${eventId}/travelers/form-config`)
    return data.data ?? data
  },

  saveFormConfig: async (eventId: string, body: Partial<TravelerFormConfig>): Promise<TravelerFormConfig> => {
    const { data } = await api.put(`/admin/events/${eventId}/travelers/form-config`, body)
    return data.data ?? data
  },
}
