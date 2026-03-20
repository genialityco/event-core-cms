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
}

export interface OrganizationBranding {
  primaryColor: string
  secondaryColor: string
  tabBarColor?: string
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
