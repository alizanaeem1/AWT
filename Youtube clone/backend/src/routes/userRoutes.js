import { Router } from "express";
import { getChannelProfile, updateProfile, uploadAvatar } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { updateProfileValidator } from "../validators/authValidators.js";
import upload from "../middleware/uploadMiddleware.js";

const router = Router();

router.patch("/profile", protect, updateProfileValidator, validate, updateProfile);
router.patch("/profile/avatar", protect, upload.single("avatar"), uploadAvatar);
router.get("/:id", getChannelProfile);

export default router;
