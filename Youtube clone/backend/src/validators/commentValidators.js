import { body, param } from "express-validator";

export const addCommentValidator = [
  body("videoId").isMongoId().withMessage("Valid video ID is required"),
  body("content").trim().notEmpty().withMessage("Comment content is required")
];

export const updateCommentValidator = [
  param("id").isMongoId().withMessage("Invalid comment ID"),
  body("content").trim().notEmpty().withMessage("Comment content is required")
];

export const userIdValidator = [param("userId").isMongoId().withMessage("Invalid user ID")];
