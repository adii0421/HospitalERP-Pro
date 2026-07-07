import { createResourceApi } from "./resource";
import api from "./axios";

export const staffApi = createResourceApi("/staff");

export const leaveRequestApi = {
  list: (params = {}) => api.get("/staff/leave/all", { params }),
  create: (payload) => api.post("/staff/leave", payload),
  update: (id, payload) => api.put(`/staff/leave/${id}`, payload),
  remove: (id) => api.delete(`/staff/leave/${id}`),
};
