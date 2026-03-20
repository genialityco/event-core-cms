import { api } from './api'

export const agendaService = {
  getByEvent: async (eventId: string) => {
    const { data } = await api.get('/admin/agendas', { params: { eventId } })
    return data.data?.items ?? data.data ?? []
  },
  create: async (body: any) => {
    const { data } = await api.post('/admin/agendas', body)
    return data.data ?? data
  },
  update: async (id: string, body: any) => {
    const { data } = await api.put(`/admin/agendas/${id}`, body)
    return data.data ?? data
  },
  publish: async (id: string) => {
    const { data } = await api.patch(`/admin/agendas/${id}/publish`, {})
    return data.data ?? data
  },
  unpublish: async (id: string) => {
    const { data } = await api.patch(`/admin/agendas/${id}/unpublish`, {})
    return data.data ?? data
  },
  remove: async (id: string) => {
    await api.delete(`/admin/agendas/${id}`)
  },
}
