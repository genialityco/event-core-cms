import { api } from "./api";

export interface Speaker {
  _id: string;
  eventId: string;
  names: string;
  role?: string;
  roleEN?: string;
  organization?: string;
  description?: string;
  descriptionEN?: string;
  location?: string;
  imageUrl?: string;
  country?: string;
}

export const speakersService = {
  getByEvent: async (eventId: string): Promise<Speaker[]> => {
    const { data } = await api.get("/admin/speakers", { params: { eventId } });
    return data.data?.items ?? data.data ?? [];
  },
  create: async (body: Partial<Speaker>): Promise<Speaker> => {
    const { data } = await api.post("/admin/speakers", body);
    return data.data ?? data;
  },
  update: async (id: string, body: Partial<Speaker>): Promise<Speaker> => {
    const { data } = await api.put(`/admin/speakers/${id}`, body);
    return data.data ?? data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/speakers/${id}`);
  },
};
