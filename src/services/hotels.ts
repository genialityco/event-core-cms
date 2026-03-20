import { api } from './api'
import type { Hotel } from '@/types/hotel'

export const hotelsService = {
  getByEvent: async (eventId: string): Promise<Hotel[]> => {
    const { data } = await api.get('/admin/hotels', { params: { eventId } })
    return data.data?.items ?? data.data ?? []
  },

  create: async (body: Partial<Hotel>): Promise<Hotel> => {
    const { data } = await api.post('/admin/hotels', body)
    return data.data ?? data
  },

  update: async (id: string, body: Partial<Hotel>): Promise<Hotel> => {
    const { data } = await api.put(`/admin/hotels/${id}`, body)
    return data.data ?? data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/hotels/${id}`)
  },
}
