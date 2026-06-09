import apiClient from "./client";

export const login = (data) =>
  apiClient.post("/auth/login", data).then((r) => r.data);

export const register = (data) =>
  apiClient.post("/auth/register", data).then((r) => r.data);

export const trainerRegister = (data) =>
  apiClient.post("/auth/trainer/register", data).then((r) => r.data);

export const getMe = () =>
  apiClient.get("/auth/me").then((r) => r.data);

export const updateMe = (data) =>
  apiClient.patch("/auth/me", data).then((r) => r.data);

export const changePassword = (data) =>
  apiClient.patch("/auth/me/password", data).then((r) => r.data);

export const inviteTrainer = (data) =>
  apiClient.post("/auth/invite-trainer", data).then((r) => r.data);