import api from "./axios.js";

export const getWatchHistory = async () => {
  const { data } = await api.get("/history");
  return data;
};

export const addToWatchHistory = async (videoId) => {
  const { data } = await api.post("/history", { videoId });
  return data;
};

export const clearWatchHistory = async () => {
  const { data } = await api.delete("/history");
  return data;
};
