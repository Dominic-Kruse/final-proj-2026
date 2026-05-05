import { Router } from "express";
import { auditLogsController } from "../controllers/auditLogsController";

const router = Router();

router.get("/", auditLogsController.getAuditLogs);

export default router;