import { Router } from "express";
import {
  createVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  toggleLike,
  toggleDislike,
  incrementViews,
  getLikedVideos,
  getMyVideos,
  getSubscriptionsFeed,
  getVideosByChannel
} from "../controllers/videoController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import upload from "../middleware/uploadMiddleware.js";
import { createVideoValidator, updateVideoValidator, idValidator, channelIdValidator } from "../validators/videoValidators.js";

const router = Router();

router.get("/", getVideos);
// Static, user-specific feeds must be declared before `/:id`
// otherwise Express will treat "liked" as an `id` and fail validation.
router.get("/liked", protect, getLikedVideos);
router.get("/my", protect, getMyVideos);
router.get("/subscriptions/feed", protect, getSubscriptionsFeed);

router.get("/channel/:channelId", channelIdValidator, validate, getVideosByChannel);

router.get("/:id", idValidator, validate, getVideoById);
router.post(
  "/",
  protect,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  createVideoValidator,
  validate,
  createVideo
);
router.patch("/:id", protect, idValidator, updateVideoValidator, validate, updateVideo);
router.delete("/:id", protect, idValidator, validate, deleteVideo);
router.patch("/:id/views", idValidator, validate, incrementViews);
router.patch("/:id/like", protect, idValidator, validate, toggleLike);
router.patch("/:id/dislike", protect, idValidator, validate, toggleDislike);

export default router;
