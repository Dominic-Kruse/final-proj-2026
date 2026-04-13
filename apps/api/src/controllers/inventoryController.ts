import { db } from "../db";
import { inventoryBatches, products, stockTransactions } from "../db/schema";
import { eq, ilike, inArray, or, sql } from "drizzle-orm";
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
  async getAllInventory(req: Request, res: Response) {
    try {
      const pageQuery = Number(req.query.page ?? 1);
      const limitQuery = Number(req.query.limit ?? 20);
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

      const page = Number.isFinite(pageQuery) && pageQuery > 0 ? Math.floor(pageQuery) : 1;
      const limit = Number.isFinite(limitQuery) && limitQuery > 0
        ? Math.min(Math.floor(limitQuery), 100)
        : 20;

      const whereClause = search
        ? or(
          ilike(products.name, `%${search}%`),
          ilike(products.genericName, `%${search}%`),
        )
        : undefined;

      const [{ totalCount }] = await db
        .select({ totalCount: sql<number>`count(*)::int` })
        .from(products)
        .where(whereClause);

      const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / limit);
      const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
      const offset = (currentPage - 1) * limit;

      const pagedProducts = await db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(products.name)
        .limit(limit)
        .offset(offset);

      const productIds = pagedProducts.map((p) => p.id);
      if (productIds.length === 0) {
        res.status(200).json({
          metadata: {
            currentPage,
            totalPages,
            totalCount,
            limit,
          },
          data: [],
        });
        return;
      }

      const [stockByProduct, batches] = await Promise.all([
        db
          .select({
            productId: inventoryBatches.productId,
            totalStock: sql<number>`coalesce(sum(case when ${inventoryBatches.status} = 'available' then ${inventoryBatches.currentQuantity} else 0 end), 0)::int`,
          })
          .from(inventoryBatches)
          .where(inArray(inventoryBatches.productId, productIds))
          .groupBy(inventoryBatches.productId),
        db
          .select()
          .from(inventoryBatches)
          .where(inArray(inventoryBatches.productId, productIds)),
      ]);

      const stockMap = new Map<number, number>();
      for (const row of stockByProduct) {
        if (row.productId != null) stockMap.set(row.productId, row.totalStock);
      }

      const batchesByProduct = new Map<number, typeof batches>();
      for (const batch of batches) {
        const key = batch.productId;
        if (key == null) continue;
        const existing = batchesByProduct.get(key) ?? [];
        existing.push(batch);
        batchesByProduct.set(key, existing);
      }

      const data = pagedProducts.map((product) => ({
        ...product,
        batches: batchesByProduct.get(product.id) ?? [],
        totalStock: stockMap.get(product.id) ?? 0,
      }));

      res.status(200).json({
        metadata: {
          currentPage,
          totalPages,
          totalCount,
          limit,
        },
        data,
      });
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
};