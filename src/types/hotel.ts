export interface Hotel {
  _id: string;
  eventId: string;
  organizationId: string;
  name: string;
  address?: string;
  phone?: string;
  price?: string;
  bookingUrl?: string;
  hotelUrl?: string;
  imageUrl?: string;
  isMain?: boolean;
  distanceMinutes?: number;
  order?: number;
  createdAt: string;
  updatedAt: string;
}
