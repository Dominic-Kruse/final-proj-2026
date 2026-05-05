import { db } from "../db";
import { products, inventoryBatches, stockTransactions } from "../db/schema";
import { eq, ilike, or, sql, inArray } from "drizzle-orm";
import { Request, Response } from "express";
import { getAuditActorContext } from "../services/auditContext";
import { logAuditEvent } from "../services/auditService";

// ── Shared error helper ────────────────────────────────────────────────────────
function handleError(res: Response, error: unknown, message: string) {
  console.error(`[productsController] ${message}:`, error);
  res.status(500).json({ error: message });
}

export const productsController = {

  async getProducts(req: Request, res: Response) {
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

      const rows = await db
        .select({
          id: products.id,
          sku: products.sku,
          name: products.name,
          genericName: products.genericName,
          description: products.description,
          category: products.category,
          form: products.form,
          baseUnit: products.baseUnit,
          packageUnit: products.packageUnit,
          conversionFactor: products.conversionFactor,
          isPrescriptionRequired: products.isPrescriptionRequired,
          requiresColdChain: products.requiresColdChain,
          reorderLevel: products.reorderLevel,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .where(whereClause)
        .orderBy(products.name)
        .limit(limit)
        .offset(offset);

      res.status(200).json({
        metadata: {
          currentPage,
          totalPages,
          totalCount,
          limit,
        },
        data: rows,
      });
    } catch (error) {
      handleError(res, error, "Failed to fetch products");
    }
  },

  async getProductById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: "Invalid product ID" });
        return;
      }

      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      res.json(product);
    } catch (error) {
      handleError(res, error, "Failed to fetch product");
    }
  },

  async addProduct(req: Request, res: Response) {
    try {
      const actorContext = getAuditActorContext(req);
      const {
        sku, name, genericName, description,
        category, form, baseUnit, packageUnit,
        conversionFactor, isPrescriptionRequired,
        requiresColdChain, reorderLevel,
      } = req.body;

      if (!name?.trim() || !genericName?.trim() || !baseUnit?.trim()) {
        res.status(400).json({ error: "name, genericName, and baseUnit are required" });
        return;
      }

      const [newProduct] = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(products)
          .values({
            sku, name: name.trim(), genericName: genericName.trim(),
            description, category, form,
            baseUnit: baseUnit.trim(), packageUnit,
            conversionFactor: conversionFactor ?? 1,
            isPrescriptionRequired: isPrescriptionRequired ?? false,
            requiresColdChain: requiresColdChain ?? false,
            reorderLevel: reorderLevel ?? 10,
          })
          .returning();

        await logAuditEvent(tx, {
          action: "create",
          entityType: "product",
          entityId: created.id,
          newValues: created,
          context: actorContext,
        });

        return [created];
      });

      res.status(201).json(newProduct);
    } catch (error) {
      handleError(res, error, "Failed to add product");
    }
  },

  async updateProduct(req: Request, res: Response) {
    try {
      const actorContext = getAuditActorContext(req);
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: "Invalid product ID" });
        return;
      }

      const {
        sku, name, genericName, description,
        category, form, baseUnit, packageUnit,
        conversionFactor, isPrescriptionRequired,
        requiresColdChain, reorderLevel,
      } = req.body;

      if (typeof name === "string" && !name.trim()) {
        res.status(400).json({ error: "Product name cannot be empty" });
        return;
      }


      const [updated] = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(products)
          .where(eq(products.id, id))
          .limit(1);

        if (!existing) {
          return [undefined];
        }

        const [saved] = await tx
          .update(products)
          .set({
            sku,
            name: typeof name === "string" ? name.trim() : name,
            genericName,
            description,
            category,
            form,
            baseUnit,
            packageUnit,
            conversionFactor,
            isPrescriptionRequired,
            requiresColdChain,
            reorderLevel,
            updatedAt: new Date(),
          })

          .where(eq(products.id, id))
          .returning();
        
        const submittedFields = Object.keys(req.body ?? {}).filter(
          (key) => key !== "performedBy",
        );
        const isRenameOnly =
          submittedFields.length === 1 &&
          submittedFields[0] === "name" &&
          existing.name !== saved.name;


        await logAuditEvent(tx, {
          action: isRenameOnly ? "rename" : "update",
          entityType: "product",
          entityId: id,
          oldValues: existing,
          newValues: saved,
          context: actorContext,
        });


        return [saved];
      });

      if (!updated) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      res.json(updated);
    } catch (error) {
      handleError(res, error, "Failed to update product");
    }
  },

  async deleteProduct(req: Request, res: Response) {
  try {
    const actorContext = getAuditActorContext(req);
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid product ID" });
      return;
    }

    const [deleted] = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!existing) {
        return [undefined];
      }

      const batchesToDelete = await tx
        .select()
        .from(inventoryBatches)
        .where(eq(inventoryBatches.productId, id));

      const batchIds = batchesToDelete.map((batch) => batch.id);

      if (batchIds.length > 0) {
        await tx
          .update(stockTransactions)
          .set({ batchId: null })
          .where(inArray(stockTransactions.batchId, batchIds));

        await tx
          .delete(inventoryBatches)
          .where(eq(inventoryBatches.productId, id));
      }

      const [removed] = await tx
        .delete(products)
        .where(eq(products.id, id))
        .returning();

      await logAuditEvent(tx, {
        action: "delete",
        entityType: "product",
        entityId: id,
        oldValues: {
          ...existing,
          deletedBatches: batchesToDelete,
        },
        context: actorContext,
      });

      return [removed];
    });

    if (!deleted) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({
      message: "Product deleted successfully",
      product: deleted,
    });
  } catch (error) {
    handleError(res, error, "Failed to delete product");
  }
},

};