import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (String(req.user._id) === String(channelId)) throw new ApiError(400, "You cannot subscribe to yourself");

  const channel = await User.findById(channelId);
  if (!channel) throw new ApiError(404, "Channel not found");

  const existing = await Subscription.findOne({ subscriber: req.user._id, channel: channelId });

  if (existing) {
    await existing.deleteOne();
    await User.findByIdAndUpdate(channelId, { $inc: { subscribersCount: -1 } });
    return res.json({ subscribed: false });
  }

  await Subscription.create({ subscriber: req.user._id, channel: channelId });
  await User.findByIdAndUpdate(channelId, { $inc: { subscribersCount: 1 } });
  return res.json({ subscribed: true });
});

export const subscriptionStatus = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) throw new ApiError(400, "channelId is required");

  // You can't subscribe to yourself; treat as not subscribed.
  const isSelf = String(req.user._id) === String(channelId);
  if (isSelf) return res.json({ subscribed: false, self: true });

  const existing = await Subscription.findOne({ subscriber: req.user._id, channel: channelId });
  return res.json({ subscribed: Boolean(existing), self: false });
});

export const getMySubscriptions = asyncHandler(async (req, res) => {
  const subs = await Subscription.find({ subscriber: req.user._id }).populate(
    "channel",
    "name avatar subscribersCount bio"
  );

  const channels = subs.map((s) => s.channel).filter(Boolean);
  res.json(channels);
});
