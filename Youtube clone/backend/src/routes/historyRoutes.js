import { Router } from "express";
import { addToHistory, getHistory, clearHistory } from "../controllers/historyController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { body } from "express-validator";

const router = Router();

router.use(protect);

router.post("/", [body("videoId").isMongoId().withMessage("Invalid video ID")], validate, addToHistory);
router.get("/", getHistory);
router.delete("/", clearHistory);

export default router;
