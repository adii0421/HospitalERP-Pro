import api from "./axios";

export const authApi = {
  login: (email, password) => api.post("/auth/login-json", { email, password }),
  me: () => api.get("/auth/me"),
  register: (payload) => api.post("/auth/register", payload),
};
