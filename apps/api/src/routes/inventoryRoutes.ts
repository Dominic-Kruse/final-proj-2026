import { Router } from "express";
import { inventoryController } from "../controllers/inventoryController";

const router = Router();

router.get("/", inventoryController.getAllInventory);
router.get("/:id", inventoryController.getInventoryById);
router.post("/stock-inward", inventoryController.stockInward);
router.post("/stock-outward", inventoryController.stockOutward);

export default router;