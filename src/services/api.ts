import axios from 'axios'
import { auth } from '@/lib/firebase'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

api.interceptors.request.use(async (config) => {
  // Firebase auth token
  const token = await auth.currentUser?.getIdToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Inject org ID from URL: /organizations/:id/...
  const match = window.location.pathname.match(/\/organizations\/([^/]+)/)
  const orgId = match?.[1]
  if (orgId) {
    config.headers['x-organization-id'] = orgId
  }

  return config
})
