import api from "./axios";

export const medicineApi = {
  list: (params = {}) => api.get("/pharmacy/medicines", { params }),
  get: (id) => api.get(`/pharmacy/medicines/${id}`),
  create: (payload) => api.post("/pharmacy/medicines", payload),
  update: (id, payload) => api.put(`/pharmacy/medicines/${id}`, payload),
  remove: (id) => api.delete(`/pharmacy/medicines/${id}`),
  lowStock: () => api.get("/pharmacy/medicines/low-stock"),
};

export const prescriptionApi = {
  list: (params = {}) => api.get("/pharmacy/prescriptions", { params }),
  get: (id) => api.get(`/pharmacy/prescriptions/${id}`),
  create: (payload) => api.post("/pharmacy/prescriptions", payload),
  update: (id, payload) => api.put(`/pharmacy/prescriptions/${id}`, payload),
  remove: (id) => api.delete(`/pharmacy/prescriptions/${id}`),
  dispense: (id) => api.post(`/pharmacy/prescriptions/${id}/dispense`),
};
