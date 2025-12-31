import { Router } from "express";
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  loginUser,
} from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../helpers/authorize";

const router = Router();

router.post("/login", loginUser);
router.get("/", authenticate, authorize("manage_users"), listUsers);
router.get("/:id", authenticate, authorize("manage_users"), getUser);
router.post("/",authenticate, authorize("manage_users"), createUser);
router.patch("/:id", authenticate, authorize("manage_users"), updateUser);
router.delete("/:id", authenticate, authorize("manage_users"), deleteUser);

export default router;
