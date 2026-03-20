import { api } from './api'
import type { UsefulInfo } from '@/types/useful-info'

export const usefulInfoService = {
  getByEvent: async (eventId: string): Promise<UsefulInfo[]> => {
    const { data } = await api.get('/admin/useful-info', { params: { eventId } })
    return data.data?.items ?? data.data ?? []
  },

  create: async (body: Partial<UsefulInfo>): Promise<UsefulInfo> => {
    const { data } = await api.post('/admin/useful-info', body)
    return data.data ?? data
  },

  update: async (id: string, body: Partial<UsefulInfo>): Promise<UsefulInfo> => {
    const { data } = await api.put(`/admin/useful-info/${id}`, body)
    return data.data ?? data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/useful-info/${id}`)
  },
}
