import { Router } from "express";
import { DistributionsController } from "../controllers/distributions.controller";
import { authorize } from "../helpers/authorize";
import { authenticate } from "../middlewares/auth";

const router = Router();
const controller = new DistributionsController();

router.get("/drivers", authenticate, authorize("view_distribution"), controller.listDrivers);
router.get("/ministry", authenticate, authorize("view_distribution"), controller.getMinistry);
router.get("/agency", authenticate, authorize("view_distribution"), controller.getAgency);
router.get("/summary", authenticate, authorize("view_distribution"), controller.getSummary);

export default router;


