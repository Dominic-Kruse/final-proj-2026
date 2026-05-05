import express from "express";
import { dashboardController } from "../controllers/dashboardController";

const router = express.Router();

router.get("/weekly-revenue", dashboardController.getWeeklyRevenue);
router.get("/sales-by-category", dashboardController.getSalesByCategory);
router.get("/sales-by-expiry-status", dashboardController.getSalesByExpiryStatus);
router.get("/stock-by-category", dashboardController.getStockByCategory);
router.get("/stock-by-expiry-heatmap", dashboardController.getStockByExpiryHeatmap);

export default router;
