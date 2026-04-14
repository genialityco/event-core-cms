export interface TravelerInfo {
  _id: string
  userId: string
  eventId: string
  organizationId: string

  // Identificación profesional
  tvChannel: string
  position: string

  // Vuelo de ida
  outboundOriginCity: string
  outboundFlightNumber: string
  outboundArrivalTime: string

  // Vuelo de regreso
  returnOriginCity: string
  returnFlightNumber: string
  returnArrivalTime: string

  // Requerimientos especiales
  dietaryRestrictions: string

  // Enriquecido desde User en la API admin
  userEmail: string | null

  createdAt: string
  updatedAt: string
}
