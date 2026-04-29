import api from "./axios";

export const registerApi = (payload) => api.post("/auth/register", payload);
export const loginApi = (payload) => api.post("/auth/login", payload);
export const meApi = () => api.get("/auth/me");
export const updateProfileApi = (payload) => api.patch("/users/profile", payload);
export const uploadAvatarApi = (formData) =>
  api.patch("/users/profile/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
