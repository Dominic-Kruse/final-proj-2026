import { db } from "../db";
import { inventoryBatches, stockTransactions } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { type AuditActorContext, logAuditEvent } from "../services/auditService";
import { type Command } from "./BaseCommand";

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
  dispensedBatchIds: number[];
}

// ── Typed validation error ─────────────────────────────────────────────────────
export class StockOutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockOutValidationError";
  }
}

// ── Shared active-batch filter ─────────────────────────────────────────────────
export const activeBatchFilter = eq(inventoryBatches.status, "available");

// ── Command ────────────────────────────────────────────────────────────────────
export class StockOutCommand implements Command<StockOutwardResult> {
  private payload: StockOutwardPayload;

  constructor(payload: StockOutwardPayload) {
    this.payload = payload;
  }

  // ── Public entry point (Command interface) ───────────────────────────────────
  async execute(): Promise<StockOutwardResult> {
    this.validate();
    const dispensedBatchIds = await this.runTransaction();
    return {
      message: `Dispensed ${this.payload.items.length} batch(es) successfully.`,
      dispensedBatchIds,
    };
  }

  // ── Step 1: validate ─────────────────────────────────────────────────────────
  private validate(): void {
    const { items } = this.payload;

    if (!Array.isArray(items) || items.length === 0)
      throw new StockOutValidationError("At least one item is required");

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

  // ── Step 2: execute transaction ──────────────────────────────────────────────
  private async runTransaction(): Promise<number[]> {
    const { items, performedBy, actorContext } = this.payload;
    const actor = performedBy?.trim() || "Unknown";
    const dispensedBatchIds: number[] = [];

    await db.transaction(async (tx) => {
      for (const item of items) {
        // Row-level lock — prevents concurrent dispense race conditions
        const [batch] = await tx
          .select()
          .from(inventoryBatches)
          .where(
            and(
              eq(inventoryBatches.id, item.batchId),
              activeBatchFilter,
            )
          )
          .for("update")
          .limit(1);

        if (!batch)
          throw new StockOutValidationError(
            `Batch ${item.batchId} not found or is no longer available`
          );

        if (batch.currentQuantity < item.quantity)
          throw new StockOutValidationError(
            `Insufficient stock for batch ${batch.batchNumber} ` +
            `(available: ${batch.currentQuantity}, requested: ${item.quantity})`
          );

        const newQuantity = batch.currentQuantity - item.quantity;
        const isFullyDispensed = newQuantity === 0;

        await tx
          .update(inventoryBatches)
          .set({
            currentQuantity: newQuantity,
            ...(isFullyDispensed && { status: "dispensed" }),
          })
          .where(eq(inventoryBatches.id, item.batchId));

        await tx.insert(stockTransactions).values({
          batchId: item.batchId,
          type: "outward",
          quantityChanged: -item.quantity,
          reason: item.reason,
          performedBy: actor,
        });

        await logAuditEvent(tx, {
          action: "stock_outward",
          entityType: "inventory_batch",
          entityId: item.batchId,
          oldValues: {
            previousQuantity: batch.currentQuantity,
            status: batch.status,
          },
          newValues: {
            newQuantity,
            deductedQuantity: item.quantity,
            reason: item.reason,
            status: isFullyDispensed ? "dispensed" : "available",
          },
          context: actorContext ?? { performedBy: actor },
        });

        dispensedBatchIds.push(item.batchId);
      }
    });

    return dispensedBatchIds;
  }
}