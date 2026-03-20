export interface UsefulInfo {
  _id: string
  eventId: string
  organizationId: string
  title: string
  category: string
  icon: string
  content: string
  coverImageUrl?: string
  isPublished: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export const CATEGORIES = [
  { key: 'passport', label: 'Pasaporte', icon: '🛂' },
  { key: 'visa', label: 'Visa', icon: '📋' },
  { key: 'airlines', label: 'Aerolíneas', icon: '✈️' },
  { key: 'payment', label: 'Métodos de pago', icon: '💳' },
  { key: 'transport', label: 'Traslados', icon: '🚌' },
  { key: 'accommodation', label: 'Alojamiento', icon: '🏨' },
  { key: 'plugs', label: 'Enchufes / voltaje', icon: '🔌' },
  { key: 'tourism', label: 'Lugares turísticos', icon: '🗺️' },
  { key: 'security', label: 'Seguridad', icon: '🔒' },
  { key: 'general', label: 'General', icon: '📌' },
]
