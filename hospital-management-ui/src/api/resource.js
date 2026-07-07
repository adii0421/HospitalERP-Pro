import api from "./axios";

/**
 * Creates a standard set of CRUD methods for a REST resource.
 * @param {string} basePath - e.g. "/patients"
 */
export function createResourceApi(basePath) {
  return {
    list: (params = {}) => api.get(`${basePath}/`, { params }),
    get: (id) => api.get(`${basePath}/${id}`),
    create: (payload) => api.post(`${basePath}/`, payload),
    update: (id, payload) => api.put(`${basePath}/${id}`, payload),
    remove: (id) => api.delete(`${basePath}/${id}`),
  };
}
