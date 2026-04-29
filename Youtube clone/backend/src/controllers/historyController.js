import History from "../models/History.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// Add or update watch history
export const addToHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) throw new ApiError(400, "Video ID is required");

  const historyItem = await History.findOneAndUpdate(
    { user: req.user._id, video: videoId },
    { user: req.user._id, video: videoId },
    { upsert: true, new: true }
  );

  res.status(200).json(historyItem);
});

// Get watch history for user
export const getHistory = asyncHandler(async (req, res) => {
  const history = await History.find({ user: req.user._id })
    .populate({
      path: "video",
      populate: { path: "owner", select: "name avatar" }
    })
    .sort({ updatedAt: -1 });

  // Filter out any where video might have been deleted but history remains
  const validHistory = history.filter(h => h.video !== null);

  const videos = validHistory.map(h => {
    return {
      ...h.video.toObject(),
      watchedAt: h.updatedAt
    };
  });

  res.json(videos);
});

// Clear history
export const clearHistory = asyncHandler(async (req, res) => {
  await History.deleteMany({ user: req.user._id });
  res.json({ message: "Watch history cleared" });
});
