import api from "./axios";

export const reportsApi = {
  dashboardSummary: () => api.get("/reports/dashboard-summary"),
  overview: () => api.get("/reports/overview"),
};
