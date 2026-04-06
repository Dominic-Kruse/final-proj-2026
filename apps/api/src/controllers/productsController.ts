import { db } from "../db";
import { products } from "../db/schema";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";

// ── Shared error helper ────────────────────────────────────────────────────────
function handleError(res: Response, error: unknown, message: string) {
  console.error(`[productsController] ${message}:`, error);
  res.status(500).json({ error: message });
}

export const productsController = {

  async getProducts(_req: Request, res: Response) {
    try {
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
        .from(products);

      res.json(rows);
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

      const [newProduct] = await db
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

      res.status(201).json(newProduct);
    } catch (error) {
      handleError(res, error, "Failed to add product");
    }
  },

  async updateProduct(req: Request, res: Response) {
    try {
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

      const [updated] = await db
        .update(products)
        .set({
          sku, name, genericName, description,
          category, form, baseUnit, packageUnit,
          conversionFactor, isPrescriptionRequired,
          requiresColdChain, reorderLevel,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();

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
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: "Invalid product ID" });
        return;
      }

      const [deleted] = await db
        .delete(products)
        .where(eq(products.id, id))
        .returning();

      if (!deleted) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      res.json({ message: "Product deleted successfully", product: deleted });
    } catch (error) {
      handleError(res, error, "Failed to delete product");
    }
  },
};