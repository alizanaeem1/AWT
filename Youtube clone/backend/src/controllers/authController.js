import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { signToken } from "../utils/token.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(400, "Email already in use");

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);

  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new ApiError(401, "Invalid credentials");

  const matched = await user.comparePassword(password);
  if (!matched) throw new ApiError(401, "Invalid credentials");

  const token = signToken(user._id);
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, bio: user.bio }
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const logout = asyncHandler(async (req, res) => {
  res.json({ message: "Logged out successfully" });
});
