export interface Photo {
  _id: string
  eventId: string
  organizationId: string
  userId: string
  userName: string | null
  imageUrl: string
  storageRef: string
  createdAt: string
  updatedAt: string
}
