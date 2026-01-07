import { Router } from "express";
import { DeparturesController } from "../controllers/departures.controller";
import { authorize } from "../helpers/authorize";
import { authenticate } from "../middlewares/auth";

const router = Router();
const controller = new DeparturesController();

router.get("/", authenticate, authorize("view_shipments"), controller.list);
router.get(
  "/:id",
  authenticate,
  authorize("view_shipments"),
  controller.getOne
);
router.post(
  "/",
  authenticate,
  authorize("create_departure"),
  controller.create
);
router.patch(
  "/:id",
  authenticate,
  authorize("create_departure"),
  controller.update
);
router.delete(
  "/:id",
  authenticate,
  authorize("delete_departure"),
  controller.delete
);
router.post(
  "/:id/shipments",
  authenticate,
  authorize("create_departure"),
  controller.assignShipments
);
router.delete(
  "/:id/shipments/:shipmentId",
  authenticate,
  authorize("create_departure"),
  controller.removeShipment
);
router.post(
  "/:id/seal",
  authenticate,
  authorize("validate_departure"),
  controller.seal
);
router.post(
  "/:id/close",
  authenticate,
  authorize("validate_departure"),
  controller.close
);
router.get(
  "/:id/general-waybill",
  authenticate,
  authorize("print_waybill"),
  controller.getGeneralWaybill
);
router.get(
  "/:id/summary",
  authenticate,
  authorize("view_shipments"),
  controller.getSummary
);

export default router;
