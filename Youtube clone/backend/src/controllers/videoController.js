import path from "path";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";
import Subscription from "../models/Subscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { cloudinary, isCloudinaryEnabled } from "../config/cloudinary.js";

const uploadToCloudinary = async (filePath, resourceType = "video") => {
  const result = await cloudinary.uploader.upload(filePath, { resource_type: resourceType });
  return result.secure_url;
};

export const createVideo = asyncHandler(async (req, res) => {
  if (!req.files?.video?.[0]) throw new ApiError(400, "Video file is required");
  const { title, description, category } = req.body;
  const videoFile = req.files.video[0];
  const thumbnailFile = req.files.thumbnail?.[0];

  let videoUrl = `/uploads/${path.basename(videoFile.path)}`;
  let thumbnailUrl = thumbnailFile ? `/uploads/${path.basename(thumbnailFile.path)}` : "";

  if (isCloudinaryEnabled) {
    videoUrl = await uploadToCloudinary(videoFile.path, "video");
    if (thumbnailFile) thumbnailUrl = await uploadToCloudinary(thumbnailFile.path, "image");
  }

  const video = await Video.create({
    title,
    description,
    category: category || "Entertainment",
    owner: req.user._id,
    videoUrl,
    thumbnailUrl
  });

  res.status(201).json(video);
});

export const getVideos = asyncHandler(async (req, res) => {
  const { q, category } = req.query;

  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const query = {};

  if (q) {
    const term = escapeRegex(String(q).trim());
    if (term) {
      query.$or = [
        { title: { $regex: `^${term}$`, $options: "i" } },
        { title: { $regex: `\\b${term}\\b`, $options: "i" } },
        { description: { $regex: `\\b${term}\\b`, $options: "i" } }
      ];
    }
  }

  if (category && category !== "All") {
    query.category = category;
  }

  const videos = await Video.find(query)
    .populate("owner", "name avatar")
    .sort({ createdAt: -1 });
  res.json(videos);
});

export const getVideoById = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id).populate("owner", "name avatar subscribersCount");
  if (!video) throw new ApiError(404, "Video not found");
  res.json(video);
});

export const incrementViews = asyncHandler(async (req, res) => {
  const video = await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
  if (!video) throw new ApiError(404, "Video not found");
  res.json({ views: video.views });
});

export const updateVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) throw new ApiError(404, "Video not found");
  if (String(video.owner) !== String(req.user._id)) throw new ApiError(403, "Not allowed");

  ["title", "description", "thumbnailUrl", "category"].forEach((field) => {
    if (req.body[field] !== undefined) video[field] = req.body[field];
  });

  const updated = await video.save();
  res.json(updated);
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) throw new ApiError(404, "Video not found");
  if (String(video.owner) !== String(req.user._id)) throw new ApiError(403, "Not allowed");

  await Comment.deleteMany({ video: video._id });
  await video.deleteOne();
  res.json({ message: "Video deleted" });
});

export const toggleLike = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) throw new ApiError(404, "Video not found");
  const userId = req.user._id;

  const liked = video.likes.some((id) => String(id) === String(userId));
  const disliked = video.dislikes.some((id) => String(id) === String(userId));

  if (liked) {
    video.likes = video.likes.filter((id) => String(id) !== String(userId));
  } else {
    video.likes.push(userId);
    if (disliked) video.dislikes = video.dislikes.filter((id) => String(id) !== String(userId));
  }

  await video.save();
  res.json({ likes: video.likes.length, dislikes: video.dislikes.length });
});

export const toggleDislike = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) throw new ApiError(404, "Video not found");
  const userId = req.user._id;

  const liked = video.likes.some((id) => String(id) === String(userId));
  const disliked = video.dislikes.some((id) => String(id) === String(userId));

  if (disliked) {
    video.dislikes = video.dislikes.filter((id) => String(id) !== String(userId));
  } else {
    video.dislikes.push(userId);
    if (liked) video.likes = video.likes.filter((id) => String(id) !== String(userId));
  }

  await video.save();
  res.json({ likes: video.likes.length, dislikes: video.dislikes.length });
});

export const getLikedVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({ likes: req.user._id })
    .populate("owner", "name avatar")
    .sort({ createdAt: -1 });
  res.json(videos);
});

export const getMyVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({ owner: req.user._id })
    .populate("owner", "name avatar")
    .sort({ createdAt: -1 });
  res.json(videos);
});

export const getSubscriptionsFeed = asyncHandler(async (req, res) => {
  const subs = await Subscription.find({ subscriber: req.user._id }).select("channel");
  const channelIds = subs.map((s) => s.channel);

  if (!channelIds.length) return res.json([]);

  const videos = await Video.find({ owner: { $in: channelIds } })
    .populate("owner", "name avatar")
    .sort({ createdAt: -1 });
  res.json(videos);
});

export const getVideosByChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const videos = await Video.find({ owner: channelId })
    .populate("owner", "name avatar subscribersCount")
    .sort({ createdAt: -1 });
  res.json(videos);
});
