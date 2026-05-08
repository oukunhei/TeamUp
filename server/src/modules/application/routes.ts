import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  createApplication,
  listMyApplications,
  listReceivedApplications,
  reviewApplication,
  promoteViewer,
  withdrawApplication,
} from "./controller";

const router = Router();

router.post("/", authenticate, createApplication);
router.get("/sent", authenticate, listMyApplications);
router.get("/received", authenticate, listReceivedApplications);
router.patch("/:id", authenticate, reviewApplication);
router.post("/:id/promote", authenticate, promoteViewer);
router.delete("/:id", authenticate, withdrawApplication);

export default router;
