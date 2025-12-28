import { Router } from "express";
import { DeparturesController } from "../controllers/departures.controller";
import { authorize } from "../helpers/authorize";
import { UserRole } from "../types/roles";
import { authenticate } from "../middlewares/auth";

const router = Router();
const controller = new DeparturesController();

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.post("/:id/shipments", controller.assignShipments);
router.delete("/:id/shipments/:shipmentId", controller.removeShipment);
router.post(
  "/:id/seal",
  authenticate,
  authorize(UserRole.STAFF),
  controller.seal
);
router.post("/:id/close", controller.close);
router.get("/:id/general-waybill", controller.getGeneralWaybill);
router.get("/:id/summary", controller.getSummary);

export default router;
