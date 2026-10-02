import { Router } from "express";
import { register, login, me, getUsers, sendRegistrationOtp, verifyRegistrationOtp } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = Router();
router.post("/register", register);
router.post("/register/send-otp", sendRegistrationOtp);
router.post("/register/verify-otp", verifyRegistrationOtp);
router.post("/login", login);
router.get("/me", protect, me);
router.get("/users", protect, adminOnly, getUsers);
export default router;
