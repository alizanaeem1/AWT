import { Router } from "express";
import {
  addComment,
  getCommentsByVideo,
  updateComment,
  deleteComment,
  getCommentedVideosByUser
} from "../controllers/commentController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { addCommentValidator, updateCommentValidator, userIdValidator } from "../validators/commentValidators.js";

const router = Router();

router.get("/video/:videoId", getCommentsByVideo);
router.post("/", protect, addCommentValidator, validate, addComment);
router.patch("/:id", protect, updateCommentValidator, validate, updateComment);
router.delete("/:id", protect, deleteComment);

// Videos commented by a particular user (no auth needed).
router.get("/user/:userId/videos", userIdValidator, validate, getCommentedVideosByUser);

export default router;
