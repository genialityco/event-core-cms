export interface Event {
  _id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  organizationId: string
  styles?: { eventImage?: string; miniatureImage?: string }
  createdAt: string
  updatedAt: string
}

export interface FieldConfig {
  key: string
  label: string
  required: boolean
  enabled: boolean
}

export interface SectionConfig {
  key: 'outbound_flight' | 'return_flight' | 'dietary' | 'professional'
  label: string
  enabled: boolean
  fields: FieldConfig[]
}

export interface TravelerFormConfig {
  _id?: string
  eventId: string
  sections: SectionConfig[]
  whatsappGroupUrl: string
}
