import { db } from "../db";
import { inventoryBatches, products, stockTransactions } from "../db/schema";
import { and, eq } from "drizzle-orm";
import {
  type AuditActorContext,
  logAuditEvent,
} from "../services/auditService";
import { type Command } from "./BaseCommand";
import { checkStockLevels } from "../controllers/productObserver";

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

    // Check stock levels and trigger notifications
    await this.checkNotifications(dispensedBatchIds);

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
        throw new StockOutValidationError(
          `${label}: quantity must be a positive number`,
        );
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
          .where(and(eq(inventoryBatches.id, item.batchId), activeBatchFilter))
          .for("update")
          .limit(1);

        if (!batch)
          throw new StockOutValidationError(
            `Batch ${item.batchId} not found or is no longer available`,
          );

        if (batch.currentQuantity < item.quantity)
          throw new StockOutValidationError(
            `Insufficient stock for batch ${batch.batchNumber} ` +
              `(available: ${batch.currentQuantity}, requested: ${item.quantity})`,
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

  // ── Step 3: check stock levels and trigger notifications ─────────────────────
  private async checkNotifications(batchIds: number[]): Promise<void> {
    try {
      // Collect all unique product IDs from the dispensed batches
      const productIds = new Set<number>();
      for (const batchId of batchIds) {
        const batch = await db
          .select()
          .from(inventoryBatches)
          .where(eq(inventoryBatches.id, batchId))
          .limit(1);
        if (batch && batch.length > 0) {
          const productId = batch[0].productId;
          if (productId != null) {
            productIds.add(productId);
          }
        }
      }

      // Check stock levels once per unique product
      for (const productId of productIds) {
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, productId))
          .limit(1);

        if (!product || product.length === 0) continue;

        const productData = product[0];

        // Get total quantity across all available batches for this product
        const quantityBatches = await db
          .select()
          .from(inventoryBatches)
          .where(
            and(
              eq(inventoryBatches.productId, productData.id),
              eq(inventoryBatches.status, "available"),
            ),
          );

        const totalQuantity = quantityBatches.reduce(
          (sum, b) => sum + b.currentQuantity,
          0,
        );

        // Trigger low stock notification if needed (only once per product)
        checkStockLevels(
          productData.id,
          totalQuantity,
          productData.reorderLevel || 10,
          productData.name,
        );
      }
    } catch (error) {
      console.error("Error checking stock levels for notifications:", error);
      // Don't throw - notification failure shouldn't break the operation
    }
  }
}
