import { Router } from "express";
import { productsController } from "../controllers/productControllers";

const router = Router();

router.get("/", productsController.getProducts);
router.get("/:id", productsController.getProductById);
router.post("/", productsController.addProduct);

export default router;