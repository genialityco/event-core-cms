import { api } from './api'
import type { Photo } from '@/types/photo'

export const photosService = {
  getByEvent: async (eventId: string): Promise<Photo[]> => {
    const { data } = await api.get('/admin/photos', { params: { eventId } })
    return data.data?.items ?? data.data ?? []
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/photos/${id}`)
  },
}
