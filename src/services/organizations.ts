import { api } from './api'
import type { Organization } from '@/types/organization'

export const organizationsService = {
  getAll: async (): Promise<Organization[]> => {
    const { data } = await api.get('/admin/organizations?limit=100')
    return data.data?.items ?? data.data ?? data
  },

  getById: async (id: string): Promise<Organization> => {
    const { data } = await api.get(`/admin/organizations/${id}`)
    return data.data ?? data
  },

  update: async (id: string, body: Partial<Organization>): Promise<Organization> => {
    const { data } = await api.patch(`/admin/organizations/${id}`, body)
    return data.data ?? data
  },

  create: async (body: Partial<Organization>): Promise<Organization> => {
    const { data } = await api.post('/admin/organizations', body)
    return data.data ?? data
  },
}
