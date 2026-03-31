import { Router } from "express";
import { productsController } from "../controllers/stockInwardController";

const router = Router();

router.get("/", productsController.getProducts);
router.get("/:id", productsController.getProductById);
router.post("/", productsController.addProduct);
router.put("/:id", productsController.updateProduct);
router.delete("/:id", productsController.deleteProduct);

export default router;