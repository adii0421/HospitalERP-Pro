import api from "./axios";

export const inventoryItemApi = {
  list: (params = {}) => api.get("/inventory/items", { params }),
  get: (id) => api.get(`/inventory/items/${id}`),
  create: (payload) => api.post("/inventory/items", payload),
  update: (id, payload) => api.put(`/inventory/items/${id}`, payload),
  remove: (id) => api.delete(`/inventory/items/${id}`),
  lowStock: () => api.get("/inventory/items/low-stock"),
};

export const inventoryTransactionApi = {
  list: (params = {}) => api.get("/inventory/transactions", { params }),
  create: (payload) => api.post("/inventory/transactions", payload),
};
