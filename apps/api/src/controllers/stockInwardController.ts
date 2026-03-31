import { db } from "../db";
import { products } from "../db/schema";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";

export const productsController = {

  async getProducts(_req: Request,res: Response) {
    try {
      const allProducts = await db
        .select({
          product_id: products.id,
          product_name: products.name,
          product_sku: products.sku,
          product_genericName: products.genericName,
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

      res.json(allProducts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  },

  // 2️⃣ Get a single product by ID
  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, Number(id)))
        .limit(1);

      if (!product.length) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  },

  // 3️⃣ Add a new product
  async addProduct(req: Request, res: Response) {
    try {
      const {
        sku,
        name,
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
      } = req.body;

      // Basic validation
      if (!sku || !name || !genericName || !baseUnit) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newProduct = await db
        .insert(products)
        .values({
          sku,
          name,
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
        })
        .returning();

      res.status(201).json(newProduct[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add product" });
    }
  },

  // 4️⃣ Delete a product
  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedProduct = await db
        .delete(products)
        .where(eq(products.id, Number(id)))
        .returning();

      if (!deletedProduct.length) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ message: "Product deleted successfully", product: deletedProduct[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  },

  // 5️⃣ Update a product
  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        sku,
        name,
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
      } = req.body;

      const updatedProduct = await db
        .update(products)
        .set({
          sku,
          name,
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
          updatedAt: new Date(), // Update the timestamp
        })
        .where(eq(products.id, Number(id)))
        .returning();

      if (!updatedProduct.length) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(updatedProduct[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update product" });
    }
  },
};