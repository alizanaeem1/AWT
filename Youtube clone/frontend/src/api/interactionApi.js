import api from "./axios";

export const getCommentsApi = (videoId) => api.get(`/comments/video/${videoId}`);
export const addCommentApi = (payload) => api.post("/comments", payload);
export const deleteCommentApi = (id) => api.delete(`/comments/${id}`);
export const toggleSubscriptionApi = (channelId) => api.post(`/subscriptions/${channelId}/toggle`);
export const getSubscriptionStatusApi = (channelId) => api.get(`/subscriptions/${channelId}/status`);
export const getChannelApi = (channelId) => api.get(`/users/${channelId}`);
export const getMySubscriptionsApi = () => api.get("/subscriptions");

export const getCommentedVideosApi = (userId) => api.get(`/comments/user/${userId}/videos`);
