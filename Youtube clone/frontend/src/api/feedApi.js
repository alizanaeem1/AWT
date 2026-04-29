import api from "./axios";

export const getLikedVideosApi = () => api.get("/videos/liked");
export const getMyVideosApi = () => api.get("/videos/my");
export const getSubscriptionsFeedApi = () => api.get("/videos/subscriptions/feed");

