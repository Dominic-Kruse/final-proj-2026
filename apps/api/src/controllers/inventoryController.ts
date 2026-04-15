import { db } from "../db";
import { inventoryBatches, products } from "../db/schema";
import { eq, ilike, inArray, or, sql } from "drizzle-orm";
import { Request, Response } from "express";
import {
  StockInCommand,
  StockInValidationError,
  type StockInwardPayload,
} from "../commands/Stockincommands";

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
          metadata: { currentPage, totalPages, totalCount, limit },
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
        metadata: { currentPage, totalPages, totalCount, limit },
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
  async stockInward(req: Request, res: Response) {
    try {
      const payload = req.body as StockInwardPayload;

      // ── Delegate all logic to the command ─────────────────────────────────
      const command = new StockInCommand(payload);
      const result = await command.execute();

      res.status(201).json(result);
    } catch (error) {
      // ── Translate typed errors into HTTP responses ─────────────────────────
      if (error instanceof StockInValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      handleError(res, error, "Failed to save stock inward");
    }
  },
};