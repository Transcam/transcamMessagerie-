import { Router } from "express";
import { DeparturesController } from "../controllers/departures.controller";

const router = Router();
const controller = new DeparturesController();

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.post("/:id/shipments", controller.assignShipments);
router.delete("/:id/shipments/:shipmentId", controller.removeShipment);
router.post("/:id/seal", controller.seal);
router.post("/:id/close", controller.close);
router.get("/:id/general-waybill", controller.getGeneralWaybill);
router.get("/:id/summary", controller.getSummary);

export default router;

