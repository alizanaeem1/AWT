import { body, param } from "express-validator";

export const createVideoValidator = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().notEmpty().withMessage("Description is required")
];

export const updateVideoValidator = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("description").optional().trim().notEmpty().withMessage("Description cannot be empty"),
  body("thumbnailUrl").optional().isString().withMessage("Thumbnail must be a string")
];

export const idValidator = [param("id").isMongoId().withMessage("Invalid ID")];

export const channelIdValidator = [param("channelId").isMongoId().withMessage("Invalid channel ID")];
