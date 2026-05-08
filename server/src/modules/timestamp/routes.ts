import { Router } from "express";
import { getCertificate, verifyTimestamp } from "./controller";

const router = Router();

router.get("/:hash", getCertificate);
router.post("/verify", verifyTimestamp);

export default router;
