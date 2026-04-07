import { db } from "../db";
import { inventoryBatches, products, stockTransactions } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { Request, Response } from "express";

// ── Types ──────────────────────────────────────────────────────────────────────
interface BatchInput {
  productId: number;
  batchNumber: string;
  expiryDate: string;       // "YYYY-MM-DD"
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  inventoryLocation?: string;
}

interface StockInwardBody {
  supplierName: string;
  referenceNumber: string;
  dateReceived: string;     // "YYYY-MM-DD"
  batches: BatchInput[];
  performedBy?: string;
}

// ── Shared error helper ────────────────────────────────────────────────────────
function handleError(res: Response, error: unknown, message: string) {
  console.error(`[inventoryController] ${message}:`, error);
  res.status(500).json({ error: message });
}

export const inventoryController = {

  // GET /api/inventory
  async getAllInventory(_req: Request, res: Response) {
    try {
        // Fetch all products
        const allProducts = await db.select().from(products);

        // Fetch all batches
        const allBatches = await db.select().from(inventoryBatches);

        // Group batches by productId and join onto products
        const result = allProducts.map((product) => {
            const productBatches = allBatches.filter(
                (b) => b.productId === product.id
            );
            const totalStock = productBatches
                .filter((b) => b.status === "available")
                .reduce((sum, b) => sum + b.currentQuantity, 0);

            return {
                ...product,
                batches: productBatches,
                totalStock,
            };
        });

        res.json(result);
    } catch (error) {
        handleError(res, error, "Failed to fetch inventory");
    }
},

  // GET /api/inventory/:id
  async getInventoryById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: "Invalid inventory ID" });
        return;
      }

      const [item] = await db
        .select()
        .from(inventoryBatches)
        .leftJoin(products, eq(inventoryBatches.productId, products.id))
        .where(eq(inventoryBatches.id, id));

      if (!item) {
        res.status(404).json({ error: "Inventory item not found" });
        return;
      }

      res.json(item);
    } catch (error) {
      handleError(res, error, "Failed to fetch inventory item");
    }
  },

  // POST /api/inventory/stock-inward
  // Saves the entire StockIn form in one atomic transaction:
  //   1. Validates all batch productIds exist
  //   2. Inserts all inventory_batches rows
  //   3. Logs a 'restock' stock_transaction for each batch
  async stockInward(req: Request, res: Response) {
    try {
      const {
        supplierName,
        referenceNumber,
        dateReceived,
        batches,
        performedBy,
      } = req.body as StockInwardBody;

      // ── Validate header ──────────────────────────────────────────────────────
      if (!supplierName?.trim() || !referenceNumber?.trim() || !dateReceived) {
        res.status(400).json({
          error: "supplierName, referenceNumber, and dateReceived are required",
        });
        return;
      }

      if (!Array.isArray(batches) || batches.length === 0) {
        res.status(400).json({ error: "At least one batch is required" });
        return;
      }

      // ── Validate each batch ──────────────────────────────────────────────────
      for (const [i, b] of batches.entries()) {
        const label = `batches[${i}]`;
        if (!Number.isFinite(b.productId) || b.productId <= 0)
          return void res.status(400).json({ error: `${label}: invalid productId` });
        if (!b.batchNumber?.trim())
          return void res.status(400).json({ error: `${label}: batchNumber is required` });
        if (!b.expiryDate)
          return void res.status(400).json({ error: `${label}: expiryDate is required` });
        if (!Number.isFinite(b.quantity) || b.quantity <= 0)
          return void res.status(400).json({ error: `${label}: quantity must be a positive number` });
        if (!Number.isFinite(b.unitCost) || b.unitCost <= 0)
          return void res.status(400).json({ error: `${label}: unitCost must be positive` });
        if (!Number.isFinite(b.sellingPrice) || b.sellingPrice <= 0)
          return void res.status(400).json({ error: `${label}: sellingPrice must be positive` });
      }

      // ── Confirm all referenced products exist ────────────────────────────────
      const uniqueProductIds = [...new Set(batches.map((b) => b.productId))];
    const foundProducts = await db
        .select({ id: products.id })
        .from(products)
        .where(inArray(products.id, uniqueProductIds));

        if (foundProducts.length !== uniqueProductIds.length) {
        const foundIds = foundProducts.map((p) => p.id);
        const missing = uniqueProductIds.filter((id) => !foundIds.includes(id));
        res.status(400).json({ error: `Products not found: ${missing.join(", ")}` });
        return;
        }

      // ── Run everything in one DB transaction ─────────────────────────────────
      const savedBatches = await db.transaction(async (tx) => {
        const results = [];

        for (const b of batches) {
          // Insert the batch
          const [inserted] = await tx
            .insert(inventoryBatches)
            .values({
              productId: b.productId,
              batchNumber: b.batchNumber.trim(),
              supplierName: supplierName.trim(),       // new column
              referenceNumber: referenceNumber.trim(), // new column
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

          // Log a restock transaction for the audit trail
          await tx.insert(stockTransactions).values({
            batchId: inserted.id,
            type: "restock",
            quantityChanged: b.quantity,
            reason: `Stock inward from ${supplierName.trim()} — ref: ${referenceNumber.trim()}`,
            performedBy: performedBy ?? "system",
          });

          results.push(inserted);
        }

        return results;
      });

      res.status(201).json({
        message: `Stock inward saved. ${savedBatches.length} batch(es) added.`,
        batches: savedBatches,
      });
    } catch (error) {
      handleError(res, error, "Failed to save stock inward");
    }
  },
  async stockOutward(req: Request, res: Response) {
    try {
        const { items, performedBy } = req.body as {
            items: { batchId: number; quantity: number; reason: string }[];
            performedBy?: string;
        };

        if (!Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: "At least one item is required" });
            return;
        }

        await db.transaction(async (tx) => {
            for (const item of items) {
                // Fetch current batch
                const [batch] = await tx
                    .select()
                    .from(inventoryBatches)
                    .where(eq(inventoryBatches.id, item.batchId))
                    .limit(1);

                if (!batch) throw new Error(`Batch ${item.batchId} not found`);
                if (batch.currentQuantity < item.quantity)
                    throw new Error(`Insufficient stock for batch ${batch.batchNumber}`);

                // Deduct stock
                await tx
                    .update(inventoryBatches)
                    .set({ currentQuantity: batch.currentQuantity - item.quantity })
                    .where(eq(inventoryBatches.id, item.batchId));

                // Log transaction
                await tx.insert(stockTransactions).values({
                    batchId: item.batchId,
                    type: "sale",
                    quantityChanged: -item.quantity,
                    reason: item.reason,
                    performedBy: performedBy ?? "system",
                });
            }
        });

        res.json({ message: `Dispensed ${items.length} batch(es) successfully.` });
    } catch (error) {
        handleError(res, error, "Failed to process dispense");
    }
    },
};