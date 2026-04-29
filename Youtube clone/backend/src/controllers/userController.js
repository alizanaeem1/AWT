import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Video from "../models/Video.js";
import path from "path";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const fields = ["name", "bio", "avatar"];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  const updated = await req.user.save();
  res.json(updated);
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Avatar image is required");
  // Store as a relative URL served from /uploads static directory.
  const avatarUrl = `/uploads/${path.basename(req.file.path)}`;
  req.user.avatar = avatarUrl;
  const updated = await req.user.save();
  res.json(updated);
});

export const getChannelProfile = asyncHandler(async (req, res) => {
  const channel = await User.findById(req.params.id).select("-password");
  if (!channel) return res.status(404).json({ message: "Channel not found" });

  const videosCount = await Video.countDocuments({ owner: channel._id });
  const isSubscribed = req.user
    ? Boolean(await Subscription.findOne({ subscriber: req.user._id, channel: channel._id }))
    : false;

  res.json({ channel, videosCount, isSubscribed });
});
