import api from "./axios";
import { createResourceApi } from "./resource";

const base = createResourceApi("/doctors");

export const doctorApi = {
  ...base,
  listSchedules: (doctorId) => api.get(`/doctors/${doctorId}/schedules`),
  addSchedule: (doctorId, payload) => api.post(`/doctors/${doctorId}/schedules`, payload),
  removeSchedule: (doctorId, scheduleId) =>
    api.delete(`/doctors/${doctorId}/schedules/${scheduleId}`),
};
