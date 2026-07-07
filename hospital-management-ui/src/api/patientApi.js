import api from "./axios";
import { createResourceApi } from "./resource";

const base = createResourceApi("/patients");

export const patientApi = {
  ...base,
  appointments: (patientId) => api.get(`/patients/${patientId}/appointments`),
};
