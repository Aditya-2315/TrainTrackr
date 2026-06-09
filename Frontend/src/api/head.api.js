import apiClient from "./client";

// Clients
export const getAllClients = () =>
  apiClient.get("/head/clients").then((r) => r.data);

export const getClient = (id) =>
  apiClient.get(`/head/clients/${id}`).then((r) => r.data);

export const updateClientStatus = (id, data) =>
  apiClient.patch(`/head/clients/${id}/status`, data).then((r) => r.data);

export const getClientAllowances = (id) =>
  apiClient.get(`/head/clients/${id}/allowances`).then((r) => r.data);

export const setClientAllowance = (id, data) =>
  apiClient.post(`/head/clients/${id}/allowances`, data).then((r) => r.data);

export const deleteAllowance = (id) =>
  apiClient.delete(`/head/allowances/${id}`).then((r) => r.data);

export const getClientSessions = (id) =>
  apiClient.get(`/head/clients/${id}/sessions`).then((r) => r.data);

// Assignments
export const getAllAssignments = (params) =>
  apiClient.get("/head/assignments", { params }).then((r) => r.data);

export const createAssignment = (data) =>
  apiClient.post("/head/assignments", data).then((r) => r.data);

export const updateAssignment = (id, data) =>
  apiClient.patch(`/head/assignments/${id}`, data).then((r) => r.data);

export const deleteAssignment = (id) =>
  apiClient.delete(`/head/assignments/${id}`).then((r) => r.data);

// Workout plans
export const getAllWorkoutPlans = () =>
  apiClient.get("/head/workout-plans").then((r) => r.data);

export const getWorkoutPlan = (id) =>
  apiClient.get(`/head/workout-plans/${id}`).then((r) => r.data);

export const createWorkoutPlan = (formData) =>
  apiClient
    .post("/head/workout-plans", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const updateWorkoutPlan = (id, formData) =>
  apiClient
    .patch(`/head/workout-plans/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const deleteWorkoutPlan = (id) =>
  apiClient.delete(`/head/workout-plans/${id}`).then((r) => r.data);