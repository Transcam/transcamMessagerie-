import { Router } from "express";
import { DriversController } from "../controllers/drivers.controller";
import { authorize } from "../helpers/authorize";
import { authenticate } from "../middlewares/auth";

const router = Router();
const controller = new DriversController();

router.get("/", authenticate, authorize("view_drivers"), controller.list);
router.get("/available", authenticate, authorize("view_drivers"), controller.getAvailable);
router.get("/:id", authenticate, authorize("view_drivers"), controller.getOne);
router.post("/", authenticate, authorize("create_driver"), controller.create);
router.patch("/:id", authenticate, authorize("edit_driver"), controller.update);
router.delete("/:id", authenticate, authorize("delete_driver"), controller.delete);

export default router;

