import { Request, Response } from "express";
import {
  StockOutCommand,
  StockOutValidationError,
  type StockOutwardPayload,
} from "../commands/StockOutCommand";

// ── Shared error helper ────────────────────────────────────────────────────────
function handleError(res: Response, error: unknown, message: string) {
  console.error(`[dispenseController] ${message}:`, error);
  res.status(500).json({ error: message });
}

export const dispenseController = {

  // POST /api/dispense (or whatever your route is)
  async stockOutward(req: Request, res: Response) {
    try {
      const payload = req.body as StockOutwardPayload;

      // ── Delegate all logic to the command ─────────────────────────────────
      const command = new StockOutCommand(payload);
      const result = await command.execute();

      res.json(result);
    } catch (error) {
      // ── Translate typed errors into HTTP responses ─────────────────────────
      if (error instanceof StockOutValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      handleError(res, error, "Failed to process dispense");
    }
  },
};