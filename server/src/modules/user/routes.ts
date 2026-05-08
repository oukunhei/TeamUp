import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { getProfile, updateProfile, getUserById } from "./controller";

const router = Router();

router.get("/me", authenticate, getProfile);
router.patch("/me", authenticate, updateProfile);
router.get("/:id", authenticate, getUserById);

export default router;
