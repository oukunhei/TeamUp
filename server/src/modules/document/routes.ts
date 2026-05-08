import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middleware/auth";
import {
  uploadDocument,
  listDocuments,
  getDocument,
  downloadDocument,
  previewDocument,
  listVersions,
  rollbackVersion,
  deleteDocument,
} from "./controller";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const router = Router();

router.post("/", authenticate, upload.single("file"), uploadDocument);
router.get("/idea/:ideaId", authenticate, listDocuments);
router.get("/:id", authenticate, getDocument);
router.get("/:id/download", authenticate, downloadDocument);
router.get("/:id/preview", authenticate, previewDocument);
router.get("/:id/versions", authenticate, listVersions);
router.post("/:id/rollback", authenticate, rollbackVersion);
router.delete("/:id", authenticate, deleteDocument);

export default router;
