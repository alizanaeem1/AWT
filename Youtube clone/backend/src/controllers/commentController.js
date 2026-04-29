import Comment from "../models/Comment.js";
import Video from "../models/Video.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const addComment = asyncHandler(async (req, res) => {
  const { videoId, content } = req.body;
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  const comment = await Comment.create({ video: videoId, user: req.user._id, content });
  const populated = await comment.populate("user", "name avatar");
  res.status(201).json(populated);
});

export const getCommentsByVideo = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ video: req.params.videoId })
    .populate("user", "name avatar")
    .sort({ createdAt: -1 });
  res.json(comments);
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (String(comment.user) !== String(req.user._id)) throw new ApiError(403, "Not allowed");
  comment.content = req.body.content;
  await comment.save();
  res.json(comment);
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (String(comment.user) !== String(req.user._id)) throw new ApiError(403, "Not allowed");
  await comment.deleteOne();
  res.json({ message: "Comment deleted" });
});

export const getCommentedVideosByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Get video IDs ordered by most recent comment made by this user.
  const commentGroups = await Comment.aggregate([
    { $match: { user: userId } },
    { $group: { _id: "$video", lastCommentAt: { $max: "$createdAt" } } },
    { $sort: { lastCommentAt: -1 } },
    { $project: { videoId: "$_id" } }
  ]);

  const videoIds = commentGroups.map((g) => g.videoId);
  if (!videoIds.length) return res.json([]);

  const videos = await Video.find({ _id: { $in: videoIds } }).populate("owner", "name avatar subscribersCount");
  const videoById = new Map(videos.map((v) => [String(v._id), v]));

  // Preserve the ordering based on lastCommentAt from the aggregation result.
  const orderedVideos = videoIds.map((id) => videoById.get(String(id))).filter(Boolean);
  res.json(orderedVideos);
});
