import api from "./axios";

export const labTestApi = {
  list: (params = {}) => api.get("/laboratory/tests", { params }),
  get: (id) => api.get(`/laboratory/tests/${id}`),
  create: (payload) => api.post("/laboratory/tests", payload),
  update: (id, payload) => api.put(`/laboratory/tests/${id}`, payload),
  remove: (id) => api.delete(`/laboratory/tests/${id}`),
};

export const labOrderApi = {
  list: (params = {}) => api.get("/laboratory/orders", { params }),
  get: (id) => api.get(`/laboratory/orders/${id}`),
  create: (payload) => api.post("/laboratory/orders", payload),
  update: (id, payload) => api.put(`/laboratory/orders/${id}`, payload),
  remove: (id) => api.delete(`/laboratory/orders/${id}`),
  pending: () => api.get("/laboratory/orders/pending"),
};
