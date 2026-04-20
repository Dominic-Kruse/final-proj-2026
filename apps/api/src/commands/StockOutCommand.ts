import { db } from "../db";
import { inventoryBatches, stockTransactions } from "../db/schema";
import { eq } from "drizzle-orm";
import { type AuditActorContext, logAuditEvent } from "../services/auditService";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface DispenseItem {
  batchId: number;
  quantity: number;
  reason: string;
}

export interface StockOutwardPayload {
  items: DispenseItem[];
  performedBy?: string;
  actorContext?: AuditActorContext;
}

export interface StockOutwardResult {
  message: string;
}

// ── Typed validation error ─────────────────────────────────────────────────────
export class StockOutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockOutValidationError";
  }
}

// ── Command ────────────────────────────────────────────────────────────────────
export class StockOutCommand {
  private payload: StockOutwardPayload;

  constructor(payload: StockOutwardPayload) {
    this.payload = payload;
  }

  // ── Public entry point ───────────────────────────────────────────────────────
  async execute(): Promise<StockOutwardResult> {
    this.validateItems();
    await this.runTransaction();

    return {
      message: `Dispensed ${this.payload.items.length} batch(es) successfully.`,
    };
  }

  // ── Step 1: validate the items array ────────────────────────────────────────
  private validateItems(): void {
    const { items } = this.payload;

    if (!Array.isArray(items) || items.length === 0) {
      throw new StockOutValidationError("At least one item is required");
    }

    for (const [i, item] of items.entries()) {
      const label = `items[${i}]`;

      if (!Number.isFinite(item.batchId) || item.batchId <= 0)
        throw new StockOutValidationError(`${label}: invalid batchId`);
      if (!Number.isFinite(item.quantity) || item.quantity <= 0)
        throw new StockOutValidationError(`${label}: quantity must be a positive number`);
      if (!item.reason?.trim())
        throw new StockOutValidationError(`${label}: reason is required`);
    }
  }

  // ── Step 2: check stock levels + update batches + log transactions ───────────
  private async runTransaction(): Promise<void> {
    const { items, performedBy, actorContext } = this.payload;

    await db.transaction(async (tx) => {
      for (const item of items) {
        // Fetch the batch inside the transaction for a consistent read
        const [batch] = await tx
          .select()
          .from(inventoryBatches)
          .where(eq(inventoryBatches.id, item.batchId))
          .limit(1);

        if (!batch)
          throw new StockOutValidationError(`Batch ${item.batchId} not found`);

        if (batch.currentQuantity < item.quantity)
          throw new StockOutValidationError(
            `Insufficient stock for batch ${batch.batchNumber}`
          );

        // Deduct stock
        await tx
          .update(inventoryBatches)
          .set({ currentQuantity: batch.currentQuantity - item.quantity })
          .where(eq(inventoryBatches.id, item.batchId));

        // Audit log
        await tx.insert(stockTransactions).values({
          batchId: item.batchId,
          type: "outward",
          quantityChanged: -item.quantity,
          reason: item.reason,
          performedBy: performedBy ?? "Administrator",
        });

        await logAuditEvent(tx, {
          action: "stock_outward",
          entityType: "inventory_batch",
          entityId: item.batchId,
          oldValues: {
            previousQuantity: batch.currentQuantity,
          },
          newValues: {
            newQuantity: batch.currentQuantity - item.quantity,
            deductedQuantity: item.quantity,
            reason: item.reason,
          },
          context: actorContext ?? { performedBy: performedBy ?? "Administrator" },
        });
      }
    });
  }
}