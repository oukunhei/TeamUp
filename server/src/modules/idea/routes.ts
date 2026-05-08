import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { createIdea, listIdeas, getIdea, updateIdea, publishIdea, deleteIdea } from "./controller";

const router = Router();

router.post("/", authenticate, createIdea);
router.get("/", authenticate, listIdeas);
router.get("/:id", authenticate, getIdea);
router.patch("/:id", authenticate, updateIdea);
router.post("/:id/publish", authenticate, publishIdea);
router.delete("/:id", authenticate, deleteIdea);

export default router;
