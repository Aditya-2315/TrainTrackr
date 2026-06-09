import apiClient from "./client";

export const getMyClientProfile = () =>
  apiClient.get("/clients/profile").then((r) => r.data);

export const updateMyClientProfile = (data) =>
  apiClient.patch("/clients/profile", data).then((r) => r.data);

export const getMyTrainer = () =>
  apiClient.get("/clients/trainer").then((r) => r.data);

export const getMyWorkoutPlan = () =>
  apiClient.get("/clients/workout-plan").then((r) => r.data);

export const getMyAllowances = () =>
  apiClient.get("/clients/allowances").then((r) => r.data);