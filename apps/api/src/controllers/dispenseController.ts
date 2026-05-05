import { Request, Response } from "express";
import {
  StockOutCommand,
  StockOutValidationError,
  type StockOutwardPayload,
} from "../commands/StockOutCommand";
import {
  UndoDispenseCommand,
  UndoDispenseValidationError,
} from "../commands/UndoDispenseCommand";
import { getAuditActorContext } from "../services/auditContext";
import { commandInvoker } from "../commands/BaseCommand";

// ── Shared error helper ────────────────────────────────────────────────────────
function handleError(res: Response, error: unknown, message: string) {
  console.error(`[dispenseController] ${message}:`, error);
  res.status(500).json({ error: message });
}

export const dispenseController = {

  // POST /api/dispense (or /inventory/stock-outward)
  async stockOutward(req: Request, res: Response) {
    try {
      const payload: StockOutwardPayload = {
        ...(req.body as StockOutwardPayload),
        actorContext: getAuditActorContext(req),
      };

      const result = await commandInvoker.run(new StockOutCommand(payload));
      res.json(result);
    } catch (error) {
      if (error instanceof StockOutValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      handleError(res, error, "Failed to process dispense");
    }
  },

  // POST /api/dispense/undo/:batchId
  async undoDispense(req: Request, res: Response) {
    try {
      const batchId = Number(req.params.batchId);
      if (!Number.isFinite(batchId)) {
        res.status(400).json({ error: "Invalid batchId" });
        return;
      }

      const result = await commandInvoker.run(
        new UndoDispenseCommand({
          batchId,
          performedBy: req.body?.performedBy,
          actorContext: getAuditActorContext(req),
        })
      );

      res.json(result);
    } catch (error) {
      if (error instanceof UndoDispenseValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      handleError(res, error, "Failed to undo dispense");
    }
  },
};