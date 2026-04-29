import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { toggleSubscription, subscriptionStatus, getMySubscriptions } from "../controllers/subscriptionController.js";

const router = Router();

router.post("/:channelId/toggle", protect, toggleSubscription);
router.get("/:channelId/status", protect, subscriptionStatus);
router.get("/", protect, getMySubscriptions);

export default router;
