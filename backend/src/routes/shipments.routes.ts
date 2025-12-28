import { Router } from "express";
import { ShipmentsController } from "../controllers/shipments.controller";

const router = Router();
const controller = new ShipmentsController();

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.patch("/:id/confirm", controller.confirm);
router.patch("/:id", controller.update);
router.delete("/:id", controller.cancel);
router.get("/:id/waybill", controller.generateWaybill);
router.get("/:id/receipt", controller.generateReceipt);

export default router;


