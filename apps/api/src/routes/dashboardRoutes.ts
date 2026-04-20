import express from "express";
import { dashboardController } from "../controllers/dashboardController";

const router = express.Router();

router.get("/weekly-revenue", dashboardController.getWeeklyRevenue);

export default router;
