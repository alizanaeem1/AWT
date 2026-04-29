import api from "./axios";

export const getVideosApi = (query = "", category = "All") => {
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  if (category && category !== "All") params.append("category", category);
  const qs = params.toString();
  return api.get(qs ? `/videos?${qs}` : "/videos");
};
export const getVideoApi = (id) => api.get(`/videos/${id}`);
export const incrementViewsApi = (id) => api.patch(`/videos/${id}/views`);
export const likeVideoApi = (id) => api.patch(`/videos/${id}/like`);
export const dislikeVideoApi = (id) => api.patch(`/videos/${id}/dislike`);
export const uploadVideoApi = (formData) =>
  api.post("/videos", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

export const updateVideoApi = (id, payload) => api.patch(`/videos/${id}`, payload);
export const deleteVideoApi = (id) => api.delete(`/videos/${id}`);

export const getChannelVideosApi = (channelId) => api.get(`/videos/channel/${channelId}`);
