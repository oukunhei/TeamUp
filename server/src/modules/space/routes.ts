import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { createSpace, listSpaces, getSpace, joinSpace } from "./controller";

const router = Router();

router.post("/", authenticate, createSpace);
router.get("/", authenticate, listSpaces);
router.get("/:id", authenticate, getSpace);
router.post("/:id/join", authenticate, joinSpace);

export default router;
