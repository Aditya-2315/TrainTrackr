import apiClient from "./client";

export const createBooking = (data) =>
  // data may include clientId when called by HEAD_TRAINER
  apiClient.post("/bookings", data).then((r) => r.data);

export const getMyBookings = () =>
  apiClient.get("/bookings").then((r) => r.data);

export const getAllBookings = (params) =>
  apiClient.get("/bookings/all", { params }).then((r) => r.data);

export const getBooking = (id) =>
  apiClient.get(`/bookings/${id}`).then((r) => r.data);

// notes is now an optional reason string
export const cancelBooking = (id, notes) =>
  apiClient.patch(`/bookings/${id}/cancel`, { notes }).then((r) => r.data);

export const rescheduleBooking = (id, data) =>
  // data = { startTime, endTime, notes? }
  apiClient.patch(`/bookings/${id}/reschedule`, data).then((r) => r.data);

export const completeBooking = (id) =>
  apiClient.patch(`/bookings/${id}/complete`).then((r) => r.data);