import { api } from './api'
import type { TravelerInfo } from '@/types/traveler'

export const travelersService = {
  getByEvent: async (eventId: string): Promise<TravelerInfo[]> => {
    const { data } = await api.get(`/admin/events/${eventId}/travelers`)
    return data.data?.items ?? data.data ?? []
  },

  remove: async (eventId: string, id: string): Promise<void> => {
    await api.delete(`/admin/events/${eventId}/travelers/${id}`)
  },
}
