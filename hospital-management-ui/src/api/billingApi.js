import api from "./axios";

export const billingApi = {
  list: (params = {}) => api.get("/billing/invoices", { params }),
  get: (id) => api.get(`/billing/invoices/${id}`),
  create: (payload) => api.post("/billing/invoices", payload),
  update: (id, payload) => api.put(`/billing/invoices/${id}`, payload),
  remove: (id) => api.delete(`/billing/invoices/${id}`),
  addPayment: (invoiceId, payload) => api.post(`/billing/invoices/${invoiceId}/payments`, payload),
};
