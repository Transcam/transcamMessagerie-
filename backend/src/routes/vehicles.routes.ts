import { Router } from "express";
import { VehiclesController } from "../controllers/vehicles.controller";
import { authorize } from "../helpers/authorize";
import { authenticate } from "../middlewares/auth";

const router = Router();
const controller = new VehiclesController();

router.get("/", authenticate, authorize("view_vehicles"), controller.list);
router.get("/available", authenticate, authorize("view_vehicles"), controller.getAvailable);
router.get("/:id", authenticate, authorize("view_vehicles"), controller.getOne);
router.post("/", authenticate, authorize("create_vehicle"), controller.create);
router.patch("/:id", authenticate, authorize("edit_vehicle"), controller.update);
router.delete("/:id", authenticate, authorize("delete_vehicle"), controller.delete);

export default router;


