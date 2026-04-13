import { Router } from "express";
import { inventoryController } from "../controllers/inventoryController";
import { dispenseController } from "../controllers/dispenseController";

const router = Router();

router.get("/", inventoryController.getAllInventory);
router.get("/:id", inventoryController.getInventoryById);
router.post("/stock-inward", inventoryController.stockInward);
router.post("/stock-outward", dispenseController.stockOutward);

export default router;