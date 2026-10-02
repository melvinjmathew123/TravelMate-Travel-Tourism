import { Router } from "express";
import { createReview, getReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = Router();
router.get("/:packageId", getReviews);
router.post("/", protect, createReview);
router.post("/:packageId", protect, createReview);
export default router;
