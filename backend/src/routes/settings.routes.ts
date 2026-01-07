import { Router } from "express";
import { getSettings, updateSettings, uploadLogo } from "../controllers/settings.controller";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../helpers/authorize";
import { uploadLogo as uploadMiddleware } from "../middlewares/upload";

const router = Router();

router.get("/", authenticate, getSettings);
router.patch("/", authenticate, authorize("manage_users"), updateSettings);
router.post("/logo", authenticate, authorize("upload_logo"), uploadMiddleware.single("logo"), uploadLogo);

export default router;


