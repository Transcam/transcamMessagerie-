import { Router } from "express";
import { createUser, loginUser } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../helpers/authorize";
import { UserRole } from "../types/roles";

const router = Router();

router.post("/", authenticate, authorize(UserRole.ADMIN), createUser);
router.post("/login", loginUser);

export default router;
