import { db } from "../db";
import { inventoryBatches, products, stockTransactions } from "../db/schema";
import { inArray } from "drizzle-orm";
import { type AuditActorContext, logAuditEvent } from "../services/auditService";
import { type Command } from "./BaseCommand";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface BatchInput {
  productId: number;
  batchNumber: string;
  expiryDate: string;       // "YYYY-MM-DD"
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  inventoryLocation?: string;
}

export interface StockInwardPayload {
  supplierName: string;
  referenceNumber: string;
  dateReceived: string;     // "YYYY-MM-DD"
  batches: BatchInput[];
  performedBy?: string;
  actorContext?: AuditActorContext;
}

export interface StockInwardResult {
  message: string;
  batches: {
    id: number;
    [key: string]: unknown;
  }[];
}

// ── Typed validation error ─────────────────────────────────────────────────────
export class StockInValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockInValidationError";
  }
}

// ── Command ────────────────────────────────────────────────────────────────────
export class StockInCommand implements Command<StockInwardResult> {
  private payload: StockInwardPayload;

  constructor(payload: StockInwardPayload) {
    this.payload = payload;
  }

  // ── Public entry point (Command interface) ───────────────────────────────────
  async execute(): Promise<StockInwardResult> {
    this.validate();
    await this.assertProductsExist();
    const savedBatches = await this.runTransaction();
    return {
      message: `Stock inward saved. ${savedBatches.length} batch(es) added.`,
      batches: savedBatches,
    };
  }

  // ── Step 1: validate all fields ──────────────────────────────────────────────
  // Unified into a single validate() to match the pattern of other commands
  private validate(): void {
    const { supplierName, referenceNumber, dateReceived, batches } = this.payload;

    if (!supplierName?.trim() || !referenceNumber?.trim() || !dateReceived)
      throw new StockInValidationError(
        "supplierName, referenceNumber, and dateReceived are required"
      );

    if (!Array.isArray(batches) || batches.length === 0)
      throw new StockInValidationError("At least one batch is required");

    for (const [i, b] of batches.entries()) {
      const label = `batches[${i}]`;

      if (!Number.isFinite(b.productId) || b.productId <= 0)
        throw new StockInValidationError(`${label}: invalid productId`);
      if (!b.batchNumber?.trim())
        throw new StockInValidationError(`${label}: batchNumber is required`);
      if (!b.expiryDate)
        throw new StockInValidationError(`${label}: expiryDate is required`);
      if (!Number.isFinite(b.quantity) || b.quantity <= 0)
        throw new StockInValidationError(`${label}: quantity must be a positive number`);
      if (!Number.isFinite(b.unitCost) || b.unitCost <= 0)
        throw new StockInValidationError(`${label}: unitCost must be positive`);
      if (!Number.isFinite(b.sellingPrice) || b.sellingPrice <= 0)
        throw new StockInValidationError(`${label}: sellingPrice must be positive`);
    }
  }

  // ── Step 2: confirm all product IDs exist in the DB ──────────────────────────
  private async assertProductsExist(): Promise<void> {
    const uniqueProductIds = [...new Set(this.payload.batches.map((b) => b.productId))];

    const foundProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, uniqueProductIds));

    if (foundProducts.length !== uniqueProductIds.length) {
      const foundIds = foundProducts.map((p) => p.id);
      const missing = uniqueProductIds.filter((id) => !foundIds.includes(id));
      throw new StockInValidationError(`Products not found: ${missing.join(", ")}`);
    }
  }

  // ── Step 3: insert batches + audit log in one atomic transaction ──────────────
  private async runTransaction() {
    const { supplierName, referenceNumber, dateReceived, batches, performedBy, actorContext } =
      this.payload;
    const actor = performedBy?.trim() || "system";

    return db.transaction(async (tx) => {
      const results = [];

      for (const b of batches) {
        const [inserted] = await tx
          .insert(inventoryBatches)
          .values({
            productId: b.productId,
            batchNumber: b.batchNumber.trim(),
            supplierName: supplierName.trim(),
            referenceNumber: referenceNumber.trim(),
            inventoryLocation: b.inventoryLocation ?? "Main Shelf",
            expiryDate: b.expiryDate,
            receivedDate: dateReceived,
            initialQuantity: b.quantity,
            currentQuantity: b.quantity,
            costPrice: b.unitCost.toFixed(2),
            sellingPrice: b.sellingPrice.toFixed(2),
            status: "available",
          })
          .returning();

        await tx.insert(stockTransactions).values({
          batchId: inserted.id,
          type: "restock",
          quantityChanged: b.quantity,
          reason: `Stock inward from ${supplierName.trim()} — ref: ${referenceNumber.trim()}`,
          performedBy: actor,
        });

        await logAuditEvent(tx, {
          action: "stock_inward",
          entityType: "inventory_batch",
          entityId: inserted.id,
          newValues: {
            productId: inserted.productId,
            batchNumber: inserted.batchNumber,
            quantity: b.quantity,
            supplierName: supplierName.trim(),
            referenceNumber: referenceNumber.trim(),
            receivedDate: dateReceived,
          },
          context: actorContext ?? { performedBy: actor },
        });

        results.push(inserted);
      }

      return results;
    });
  }
}