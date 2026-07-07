import api from "./axios";
import { createResourceApi } from "./resource";

const base = createResourceApi("/appointments");

export const appointmentApi = {
  ...base,
  byDoctor: (doctorId) => api.get(`/appointments/doctor/${doctorId}`),
};
