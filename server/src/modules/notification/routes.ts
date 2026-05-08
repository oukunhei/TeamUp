import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { listNotifications, markAsRead, markAllAsRead, getUnreadCount } from "./controller";

const router = Router();

router.get("/", authenticate, listNotifications);
router.get("/unread-count", authenticate, getUnreadCount);
router.patch("/read-all", authenticate, markAllAsRead);
router.patch("/:id/read", authenticate, markAsRead);

export default router;
