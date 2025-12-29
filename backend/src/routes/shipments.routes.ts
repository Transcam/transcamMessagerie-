import { Router } from "express";
import { ShipmentsController } from "../controllers/shipments.controller";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../helpers/authorize";

const router = Router();
const controller = new ShipmentsController();

router.get("/statistics", authenticate, authorize("view_shipments"), controller.getStatistics);
router.get("/", authenticate, authorize("view_shipments"), controller.list);
router.get("/:id", authenticate, authorize("view_shipments"), controller.getOne);
router.post("/", authenticate, authorize("create_shipment"), controller.create);
router.patch("/:id/confirm", authenticate, authorize("edit_shipment"), controller.confirm);
router.patch("/:id", authenticate, authorize("edit_shipment"), controller.update);
router.delete("/:id", authenticate, authorize("delete_shipment"), controller.cancel);
router.get("/:id/waybill", authenticate, authorize("print_waybill"), controller.generateWaybill);
router.get("/:id/receipt", authenticate, authorize("print_receipt"), controller.generateReceipt);

export default router;



