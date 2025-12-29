import { Router } from "express";
import { ExpensesController } from "../controllers/expenses.controller";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../helpers/authorize";

const router = Router();
const controller = new ExpensesController();

router.get(
  "/statistics",
  authenticate,
  authorize("view_expenses"),
  controller.getStatistics
);
router.get("/", authenticate, authorize("view_expenses"), controller.list);
router.get("/:id", authenticate, authorize("view_expenses"), controller.getOne);
router.post("/", authenticate, authorize("create_expense"), controller.create);
router.patch("/:id", authenticate, authorize("edit_expense"), controller.update);
router.delete(
  "/:id",
  authenticate,
  authorize("delete_expense"),
  controller.delete
);

export default router;

