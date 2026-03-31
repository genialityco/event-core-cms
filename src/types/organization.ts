export interface OrganizationFeatures {
  agenda: boolean
  speakers: boolean
  survey: boolean
  certificate: boolean
  documents: boolean
  news: boolean
  highlights: boolean
  posters: boolean
  rooms: boolean
  traveler: boolean
  hotels: boolean
  attendance: boolean
  usefulInfo: boolean
  photos: boolean
  /** Tab que se muestra por defecto al iniciar sesión. null = primer tab habilitado. */
  defaultModule?: string | null
}

export interface OrganizationBranding {
  primaryColor: string
  primaryDarkColor?: string
  secondaryColor: string
  /** Fondo del tab bar inferior */
  tabBarColor?: string
  /** Color de ícono+texto del tab activo. null/vacío = usa primaryColor */
  tabBarActiveColor?: string
  /** Color de ícono+texto de tabs inactivos */
  tabBarInactiveColor?: string
  logoUrl?: string
  appName?: string
  fontFamily?: string
}

export interface Organization {
  _id: string
  name: string
  slug?: string
  activeEventId?: string
  auth: {
    emailPassword: boolean
    emailOtp: boolean
  }
  features: OrganizationFeatures
  branding: OrganizationBranding
  bundleIds: {
    ios?: string
    android?: string
  }
  createdAt: string
  updatedAt: string
}
