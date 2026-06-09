import apiClient from "./client";

// Own profile (TRAINER / HEAD_TRAINER)
export const getMyProfile = () =>
  apiClient.get("/trainers/profile").then((r) => r.data);

export const updateMyProfile = (data) =>
  apiClient.patch("/trainers/profile", data).then((r) => r.data);

// Own availability
export const getMyAvailability = () =>
  apiClient.get("/trainers/availability").then((r) => r.data);

export const addAvailabilitySlot = (data) =>
  apiClient.post("/trainers/availability", data).then((r) => r.data);

export const deleteAvailabilitySlot = (id) =>
  apiClient.delete(`/trainers/availability/${id}`).then((r) => r.data);

// Own exceptions
export const getMyExceptions = () =>
  apiClient.get("/trainers/availability/exceptions").then((r) => r.data);

export const addException = (data) =>
  apiClient.post("/trainers/availability/exceptions", data).then((r) => r.data);

export const deleteException = (id) =>
  apiClient.delete(`/trainers/availability/exceptions/${id}`).then((r) => r.data);

// Own clients
export const getMyClients = () =>
  apiClient.get("/trainers/clients").then((r) => r.data);

// HEAD_TRAINER — all trainers
export const getAllTrainers = () =>
  apiClient.get("/trainers").then((r) => r.data);

export const getTrainer = (id) =>
  apiClient.get(`/trainers/${id}`).then((r) => r.data);

export const getTrainerAvailability = (id) =>
  apiClient.get(`/trainers/${id}/availability`).then((r) => r.data);

export const getTrainerExceptions = (id) =>
  apiClient.get(`/trainers/${id}/availability/exceptions`).then((r) => r.data);

export const updateTrainerStatus = (id, data) =>
  apiClient.patch(`/trainers/${id}/status`, data).then((r) => r.data);